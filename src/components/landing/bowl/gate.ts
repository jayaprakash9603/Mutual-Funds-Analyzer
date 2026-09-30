import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  LineCurve3,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type Texture,
} from 'three'
import { clamp01, labelTexture } from './sceneParts'

export const GATE = { x: 0, y: 1.2, z: 0.2, radius: 1.05 }
const HALO = { x: 0, y: 2.05, z: -0.8, scale: 0.36 }
const RULES = ['Rolling', 'Consistency', 'Sharpe']
const NODE_DELAY = 0.2
const EDGE_START = 0.35
const EDGE_STAGGER = 0.25
const EDGE_SECONDS = 0.35
export const GATE_READY = 1.2

const RED = new Color('#ef4444')

function localVertex(index: number) {
  const angle = Math.PI / 2 - (index * Math.PI * 2) / 3
  return new Vector3(Math.cos(angle) * GATE.radius, Math.sin(angle) * GATE.radius, 0)
}

export type Gate = ReturnType<typeof createGate>

/**
 * The golden triangle the survivors fly through. Corners are the three rules; the membrane
 * flashes gold for a pass and red for a bounce. Later it shrinks into a halo above the podium.
 */
export function createGate(gold: Color, glowMap: Texture) {
  const group = new Group()
  group.position.set(GATE.x, GATE.y, GATE.z)
  const vertices = [0, 1, 2].map(localVertex)
  const textures: Texture[] = []

  const edgeMaterial = new MeshBasicMaterial({ color: gold, transparent: true, toneMapped: false })
  const edges = vertices.map((a, i) => {
    const edge = new Mesh(new TubeGeometry(new LineCurve3(a, vertices[(i + 1) % 3]), 40, 0.026, 8, false), edgeMaterial)
    group.add(edge)
    return edge
  })

  const nodeMaterial = new SpriteMaterial({ map: glowMap, color: gold, blending: AdditiveBlending, depthWrite: false })
  const nodes = vertices.map((point) => {
    const sprite = new Sprite(nodeMaterial)
    sprite.position.copy(point)
    group.add(sprite)
    return sprite
  })

  const labels = vertices.map((point, i) => {
    const { texture, aspect } = labelTexture(RULES[i].toUpperCase())
    textures.push(texture)
    const sprite = new Sprite(new SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 }))
    const height = 0.2
    sprite.scale.set(height * aspect, height, 1)
    const outward = point.clone().normalize().multiplyScalar(0.34)
    sprite.position.copy(point).add(outward)
    if (i === 0) sprite.position.y += 0.02
    group.add(sprite)
    return sprite
  })

  const sparkMaterial = new SpriteMaterial({ map: glowMap, color: 0xffffff, blending: AdditiveBlending, depthWrite: false })
  const spark = new Sprite(sparkMaterial)
  spark.scale.setScalar(0.55)
  group.add(spark)

  const shape = new Shape()
  shape.moveTo(vertices[0].x, vertices[0].y)
  shape.lineTo(vertices[1].x, vertices[1].y)
  shape.lineTo(vertices[2].x, vertices[2].y)
  shape.closePath()
  const membraneMaterial = new MeshBasicMaterial({
    color: gold.clone(),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  })
  const membrane = new Mesh(new ShapeGeometry(shape), membraneMaterial)
  group.add(membrane)

  const rippleMaterial = new MeshBasicMaterial({
    color: gold.clone(),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
  const ripple = new Mesh(new TorusGeometry(1, 0.03, 8, 96), rippleMaterial)
  ripple.visible = false
  group.add(ripple)

  let level = 0
  let levelTarget = 0
  let halo = 0
  let haloTarget = 0
  let flash = 0
  let rippleAge = -1
  let spin = 0

  function reset() {
    levelTarget = 0
    haloTarget = 0
    rippleAge = -1
  }

  function pulse(pass: boolean) {
    rippleAge = 0
    rippleMaterial.color.copy(pass ? gold : RED)
    if (!pass) flash = 1
  }

  /** `t` is seconds since the gate started igniting; pass a large value to show it fully drawn. */
  function update(t: number, dt: number, elapsed: number) {
    const ease = 1 - Math.exp(-dt * 6)
    level += (levelTarget - level) * ease
    halo += (haloTarget - halo) * (1 - Math.exp(-dt * 3))
    flash = Math.max(0, flash - dt * 2.5)
    group.visible = level > 0.01

    nodes.forEach((node, i) => {
      const since = t - i * NODE_DELAY
      const flare = since < 0 ? 0 : 0.7 + 1.3 * Math.exp(-since * 4)
      node.scale.setScalar(flare)
    })
    nodeMaterial.opacity = level

    let sparking = false
    edges.forEach((edge, i) => {
      const local = clamp01((t - EDGE_START - i * EDGE_STAGGER) / EDGE_SECONDS)
      const count = edge.geometry.index!.count
      edge.geometry.setDrawRange(0, Math.floor((count * local) / 3) * 3)
      edge.visible = local > 0
      if (local > 0 && local < 1) {
        sparking = true
        spark.position.lerpVectors(vertices[i], vertices[(i + 1) % 3], local)
      }
    })
    spark.visible = sparking
    edgeMaterial.opacity = level

    labels.forEach((label, i) => {
      label.material.opacity = clamp01((t - i * NODE_DELAY - 0.1) / 0.3) * level * (1 - halo)
    })

    const membraneOn = clamp01((t - 1) / 0.4)
    membraneMaterial.color.copy(gold).lerp(RED, flash)
    membraneMaterial.opacity = (0.12 + 0.05 * Math.sin(elapsed * 3) + flash * 0.25) * membraneOn * level * (1 - halo)

    if (rippleAge >= 0) {
      rippleAge += dt
      const p = rippleAge / 0.7
      ripple.visible = p < 1
      ripple.scale.setScalar(0.15 + p * 1.1)
      rippleMaterial.opacity = (1 - p) * level
      if (p >= 1) rippleAge = -1
    }

    spin += dt * 0.7 * halo
    group.position.set(
      GATE.x + (HALO.x - GATE.x) * halo,
      GATE.y + (HALO.y - GATE.y) * halo,
      GATE.z + (HALO.z - GATE.z) * halo,
    )
    group.scale.setScalar(1 + (HALO.scale - 1) * halo)
    group.rotation.y = spin
  }

  return {
    group,
    textures,
    reset,
    pulse,
    update,
    toHalo(value: number) {
      haloTarget = value
    },
    show() {
      levelTarget = 1
    },
    hide() {
      levelTarget = 0
    },
    snap() {
      level = levelTarget = 1
      halo = haloTarget
    },
  }
}
