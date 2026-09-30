import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
  type Texture,
} from 'three'
import { BALL_RADIUS } from './physics'
import { labelTexture } from './sceneParts'

export type PodiumEntry = { id: string; score: number }

const BASE_Y = 0.05
const BURST_COUNT = 260
const BURST_SECONDS = 2
const GRAVITY = -3.2

/** Rank 0 goes in the centre, then alternating left and right. */
export function podiumOrder(count: number) {
  const order: number[] = []
  for (let rank = 0; rank < count; rank += 1) {
    if (rank % 2 === 1) order.unshift(rank)
    else order.push(rank)
  }
  return order
}

type Pillar = {
  root: Group
  column: Mesh
  capMaterial: MeshBasicMaterial
  label: Sprite
  height: number
  x: number
  z: number
}

export type Podium = ReturnType<typeof createPodium>

/** Gold pillars sized by 5-year rolling average, a landing burst and a spotlight that moves between winners. */
export function createPodium(gold: Color, glowMap: Texture, compact: boolean) {
  const group = new Group()
  const textures: Texture[] = []
  const columnGeometry = new CylinderGeometry(0.24, 0.3, 1, 40)
  columnGeometry.translate(0, 0.5, 0)
  const columnMaterial = new MeshPhysicalMaterial({
    color: gold,
    metalness: 0.85,
    roughness: 0.28,
    clearcoat: 1,
    emissive: gold,
    emissiveIntensity: 0.12,
  })
  const capGeometry = new TorusGeometry(0.27, 0.018, 8, 64)

  let pillars: Pillar[] = []
  let ranked: PodiumEntry[] = []
  let rise = 0
  let riseTarget = 0
  let spotRank = 0
  const spotX = { value: 0, z: 0 }

  const coneMaterial = new MeshBasicMaterial({
    color: 0xfff4d6,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  })
  const cone = new Mesh(new ConeGeometry(0.62, 2.6, 48, 1, true), coneMaterial)
  group.add(cone)
  const floorMaterial = new SpriteMaterial({ map: glowMap, color: gold, blending: AdditiveBlending, depthWrite: false, opacity: 0 })
  const floor = new Sprite(floorMaterial)
  floor.scale.set(1.3, 0.5, 1)
  group.add(floor)

  const burstPositions = new Float32Array(BURST_COUNT * 3)
  const burstVelocities = new Float32Array(BURST_COUNT * 3)
  const burstGeometry = new BufferGeometry()
  burstGeometry.setAttribute('position', new BufferAttribute(burstPositions, 3))
  const burstMaterial = new PointsMaterial({
    color: gold,
    size: compact ? 0.07 : 0.055,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const burstPoints = new Points(burstGeometry, burstMaterial)
  burstPoints.frustumCulled = false
  group.add(burstPoints)
  let burstAge = -1

  function clearPillars() {
    pillars.forEach((pillar) => {
      group.remove(pillar.root)
      pillar.capMaterial.dispose()
      pillar.label.material.dispose()
    })
    textures.splice(0).forEach((t) => t.dispose())
    pillars = []
  }

  function setWinners(entries: PodiumEntry[]) {
    clearPillars()
    ranked = [...entries].sort((a, b) => b.score - a.score)
    const top = Math.max(...ranked.map((e) => e.score), 1)
    const spread = compact ? 0.92 : 1.2
    const order = podiumOrder(ranked.length)
    pillars = ranked.map((entry, rank) => {
      const column = order.indexOf(rank)
      const x = (column - (ranked.length - 1) / 2) * spread
      const z = 0.95 - Math.abs(x) * 0.18
      const root = new Group()
      root.position.set(x, BASE_Y, z)
      const mesh = new Mesh(columnGeometry, columnMaterial)
      root.add(mesh)
      const capMaterial = new MeshBasicMaterial({ color: gold, transparent: true, toneMapped: false })
      const cap = new Mesh(capGeometry, capMaterial)
      cap.rotation.x = Math.PI / 2
      mesh.add(cap)
      cap.position.y = 1
      const { texture, aspect } = labelTexture(`${entry.score.toFixed(1)}% 5Y avg`)
      textures.push(texture)
      const label = new Sprite(new SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 }))
      label.scale.set(0.16 * aspect, 0.16, 1)
      root.add(label)
      group.add(root)
      return { root, column: mesh, capMaterial, label, height: 0.35 + 0.95 * (entry.score / top), x, z }
    })
    spotRank = 0
  }

  function ballPoint(rank: number, scale: number, out: Vector3) {
    const pillar = pillars[rank]
    if (!pillar) return out.set(0, 1, 0.9)
    return out.set(pillar.x, BASE_Y + pillar.height * rise + BALL_RADIUS * scale + 0.03, pillar.z)
  }

  function burst() {
    burstAge = 0
    for (let i = 0; i < BURST_COUNT; i += 1) {
      const pillar = pillars[i % Math.max(pillars.length, 1)]
      const top = pillar ? BASE_Y + pillar.height : 1
      burstPositions[i * 3] = pillar?.x ?? 0
      burstPositions[i * 3 + 1] = top + 0.3
      burstPositions[i * 3 + 2] = pillar?.z ?? 0.9
      const angle = Math.random() * Math.PI * 2
      const speed = 0.6 + Math.random() * 1.6
      burstVelocities[i * 3] = Math.cos(angle) * speed
      burstVelocities[i * 3 + 1] = 1.4 + Math.random() * 2.2
      burstVelocities[i * 3 + 2] = Math.sin(angle) * speed
    }
    burstGeometry.attributes.position.needsUpdate = true
  }

  function update(dt: number, spotlightOn: boolean) {
    const ease = 1 - Math.exp(-dt * 3.5)
    rise += (riseTarget - rise) * ease
    group.visible = rise > 0.005 || burstAge >= 0
    pillars.forEach((pillar, rank) => {
      pillar.column.scale.y = Math.max(pillar.height * rise, 0.001)
      pillar.column.visible = rise > 0.005
      pillar.label.position.set(0, (pillar.height * rise) / 2, 0.34)
      pillar.label.material.opacity = Math.max(0, (rise - 0.6) / 0.4)
      pillar.capMaterial.opacity = spotlightOn && rank === spotRank ? 1 : 0.45
    })

    const target = pillars[spotRank]
    if (target) {
      spotX.value += (target.x - spotX.value) * (1 - Math.exp(-dt * 5))
      spotX.z += (target.z - spotX.z) * (1 - Math.exp(-dt * 5))
      const top = BASE_Y + target.height * rise
      cone.position.set(spotX.value, top + 1.3, spotX.z)
      floor.position.set(spotX.value, top + 0.02, spotX.z + 0.05)
    }
    const spotLevel = spotlightOn ? 1 : 0
    coneMaterial.opacity += (spotLevel * 0.11 - coneMaterial.opacity) * ease
    floorMaterial.opacity += (spotLevel * 0.9 - floorMaterial.opacity) * ease
    cone.visible = coneMaterial.opacity > 0.005

    if (burstAge >= 0) {
      burstAge += dt
      for (let i = 0; i < BURST_COUNT; i += 1) {
        burstVelocities[i * 3 + 1] += GRAVITY * dt
        burstPositions[i * 3] += burstVelocities[i * 3] * dt
        burstPositions[i * 3 + 1] += burstVelocities[i * 3 + 1] * dt
        burstPositions[i * 3 + 2] += burstVelocities[i * 3 + 2] * dt
      }
      burstGeometry.attributes.position.needsUpdate = true
      burstMaterial.opacity = Math.max(0, 1 - burstAge / BURST_SECONDS)
      if (burstAge > BURST_SECONDS) burstAge = -1
    }
    burstPoints.visible = burstAge >= 0
  }

  return {
    group,
    textures,
    setWinners,
    ballPoint,
    burst,
    update,
    ranked: () => ranked,
    raise(value: number) {
      riseTarget = value
    },
    snap() {
      rise = riseTarget
    },
    spotlight(rank: number) {
      spotRank = rank
    },
    get spotRank() {
      return spotRank
    },
    dispose() {
      clearPillars()
    },
  }
}
