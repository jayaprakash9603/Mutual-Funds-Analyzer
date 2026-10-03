import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Color,
  type Texture,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { AMCS, amcById } from './amcs'
import { createBallTexture } from './ballTexture'
import { createGate, GATE, GATE_READY } from './gate'
import { BALL_RADIUS, BOWL_RADIUS, createBodies, step, stir, type Body } from './physics'
import { createPodium } from './podium'
import {
  bowlGeometry,
  clamp01,
  cssColor,
  dustGeometry,
  easeInOut,
  glowTexture,
  labelTexture,
  markTexture,
  seeded,
  shadowTexture,
} from './sceneParts'
import {
  cubicBezier,
  planCategory,
  PODIUM_SIZE,
  RING,
  ringSlot,
  shuffle,
  type Outcome,
  type SceneCategory,
  type SieveStage,
  type StageEvent,
} from './sieve'

export type FundBowlOptions = {
  categories: SceneCategory[]
  onSpotlight: (fundId: string | null) => void
  onStage: (event: StageEvent) => void
  reduceMotion: boolean
}

export type FundBowlHandle = {
  dispose: () => void
  setScroll: (progress: number) => void
  setSpotlight: (fundId: string) => void
  setCategory: (index: number) => void
}

const NEXT_STAGE: Record<SieveStage, SieveStage> = {
  pour: 'test1',
  test1: 'test2',
  test2: 'gate',
  gate: 'podium',
  podium: 'spotlight',
  spotlight: 'drain',
  drain: 'pour',
}
const FLIGHT_GAP = 0.45
const PASS_FLIGHT = 1.15
const FAIL_FLIGHT = 0.85
const PODIUM_SECONDS = 2.4
const BURST_AT = 1.3
const POUR_SECONDS = 2.8
const POUR_GAP = 0.13
const DRAIN_SECONDS = 1.7
export const SPOT_SECONDS = 5.2
const SOLO_SPOT_SECONDS = 7
const WINNER_SCALE = 1.15
const SPOT_SCALE = 1.55
const TAU = Math.PI * 2

type Path = (t: number, out: Vector3) => void

type BallState = {
  kin: boolean
  from: Vector3
  t0: number
  dur: number
  target: (out: Vector3) => void
  path: Path | null
  outcome: Outcome
  checked: number
  flightAt: number
  frontSlot: number
  lastZ: number
  dim: number
  dimTarget: number
  glow: number
  glowTarget: number
  scale: number
  scaleTarget: number
  mark: Sprite
  markBirth: number
  draining: boolean
  spawnAt: number
}

function additive(color: Color, opacity: number) {
  return new MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: DoubleSide,
  })
}

export function createFundBowl(container: HTMLElement, options: FundBowlOptions): FundBowlHandle {
  const compact = container.clientWidth < 768
  const random = seeded(42)

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.style.display = 'block'
  container.appendChild(renderer.domElement)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = environment

  const camera = new PerspectiveCamera(compact ? 42 : 34, 1, 0.1, 100)
  const cameraBase = compact ? new Vector3(0, 6.2, 15.5) : new Vector3(0, 4.2, 11.4)
  const lookTarget = new Vector3(0, compact ? -0.2 : -0.9, 0)

  scene.add(new HemisphereLight(0xffffff, 0x0b1a14, 0.6))
  const key = new DirectionalLight(0xffffff, 2.4)
  key.position.set(4, 8, 6)
  scene.add(key)
  const primary = cssColor('--primary', '#22c55e')
  const gold = cssColor('--gold', '#e8b04b')
  const rimLight = new PointLight(primary, 30, 14)
  rimLight.position.set(-3, 1.5, -3)
  scene.add(rimLight)
  const warmLight = new PointLight(gold, 18, 12)
  warmLight.position.set(3.5, 2.5, 2)
  scene.add(warmLight)

  const world = new Group()
  scene.add(world)

  const bowl = new Mesh(
    bowlGeometry(),
    new MeshPhysicalMaterial({
      color: 0x9fd9c2,
      roughness: 0.04,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.09,
      envMapIntensity: 2.2,
      side: DoubleSide,
      depthWrite: false,
    }),
  )
  bowl.renderOrder = 2
  world.add(bowl)

  const rimMaterial = new MeshStandardMaterial({ color: primary, emissive: primary, emissiveIntensity: 1.1 })
  const rim = new Mesh(new TorusGeometry(BOWL_RADIUS + 0.06, 0.045, 16, 160), rimMaterial)
  rim.rotation.x = Math.PI / 2
  world.add(rim)

  const stand = new Mesh(
    new CylinderGeometry(0.7, 0.95, 0.22, 64),
    new MeshPhysicalMaterial({ color: 0x0f1f19, metalness: 0.8, roughness: 0.3 }),
  )
  stand.position.y = -BOWL_RADIUS - 0.2
  world.add(stand)

  const shadowMap = shadowTexture()
  const shadow = new Mesh(
    new PlaneGeometry(7, 7),
    new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -BOWL_RADIUS - 0.32
  world.add(shadow)

  const dustMaterial = new PointsMaterial({
    color: primary,
    size: compact ? 0.05 : 0.04,
    transparent: true,
    opacity: 0.55,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const dustPoints = new Points(dustGeometry(compact ? 220 : 420, random), dustMaterial)
  scene.add(dustPoints)

  const glowMap = glowTexture()
  const scanMaterial = additive(primary, 0.9)
  const scanRing = new Mesh(new TorusGeometry(1, 0.016, 8, 160), scanMaterial)
  scanRing.rotation.x = Math.PI / 2
  const scanDiscMaterial = additive(primary, 0.12)
  const scanDisc = new Mesh(new CircleGeometry(1, 96), scanDiscMaterial)
  scanDisc.rotation.x = -Math.PI / 2
  const scan = new Group()
  scan.add(scanRing, scanDisc)
  scan.visible = false
  world.add(scan)

  const beamMaterial = additive(primary, 0.85)
  const beam = new Mesh(new CylinderGeometry(0.02, 0.02, 1.5, 8, 1, true), beamMaterial)
  const beamGlowMaterial = new SpriteMaterial({ map: glowMap, color: primary, blending: AdditiveBlending, depthWrite: false })
  const beamGlow = new Sprite(beamGlowMaterial)
  beamGlow.scale.setScalar(0.9)
  const beamGroup = new Group()
  beamGroup.add(beam, beamGlow)
  beamGroup.visible = false
  world.add(beamGroup)

  const gate = createGate(gold, glowMap)
  world.add(gate.group)
  const podium = createPodium(gold, glowMap, compact)
  world.add(podium.group)

  const categories = options.categories
  const ballCount = Math.max(...categories.map((c) => c.funds.length))
  const ballGeometry = new SphereGeometry(BALL_RADIUS, 48, 32)
  const anisotropy = renderer.capabilities.getMaxAnisotropy()
  const passMap = markTexture(true)
  const failMap = markTexture(false)
  const ballMaps = new Map<string, Texture>()

  function ballMap(amcId: string, tag: string) {
    const key = `${amcId}|${tag}`
    let map = ballMaps.get(key)
    if (!map) {
      map = createBallTexture(amcById(amcId) ?? AMCS[0], anisotropy, tag)
      ballMaps.set(key, map)
    }
    return map
  }

  const balls = Array.from({ length: ballCount }, () => {
    const mesh = new Mesh(
      ballGeometry,
      new MeshPhysicalMaterial({ roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 }),
    )
    mesh.quaternion.setFromAxisAngle(new Vector3(random(), random(), random()).normalize(), random() * TAU)
    mesh.visible = false
    world.add(mesh)
    return mesh
  })
  const bodies: Body[] = createBodies(ballCount, random)
  for (let i = 0; i < 400; i += 1) step(bodies, 1 / 60)
  const restPositions = bodies.map((b) => ({ x: b.x, y: b.y, z: b.z }))

  const moreLabel = new Sprite(new SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, opacity: 0 }))
  moreLabel.renderOrder = 11
  world.add(moreLabel)
  let moreTexture: Texture | null = null
  let moreTarget = 0

  const states: BallState[] = balls.map(() => {
    const mark = new Sprite(new SpriteMaterial({ map: passMap, depthTest: false, transparent: true, opacity: 0 }))
    mark.scale.setScalar(0.3)
    mark.renderOrder = 10
    mark.visible = false
    world.add(mark)
    return {
      kin: false,
      from: new Vector3(),
      t0: 0,
      dur: 1,
      target: () => {},
      path: null,
      outcome: 1,
      checked: 0,
      flightAt: -1,
      frontSlot: 0,
      lastZ: 0,
      dim: 0,
      dimTarget: 0,
      glow: 0,
      glowTarget: 0,
      scale: 1,
      scaleTarget: 1,
      mark,
      markBirth: -1,
      draining: false,
      spawnAt: -1,
    }
  })

  let categoryIndex = 0
  let nextCategory: number | null = null
  let ids: string[] = []
  let outcomes: Outcome[] = []
  let winners: string[] = []
  let ranked: string[] = []
  let bench: string[] = []

  const facing = new Object3D()
  const roll = new Quaternion()
  const axis = new Vector3()
  const tmp = new Vector3()
  const pointer = new Vector2()
  const parallax = new Vector2()

  let stage: SieveStage = 'pour'
  let stageTime = 0
  let stageLength = POUR_SECONDS
  let clock = 0
  let spin = 0
  let counts: StageEvent['counts'] = [ballCount, ballCount, ballCount, ballCount]
  let activeCount = 0

  function activeSlots() {
    return ids.map((id, i) => (id ? i : -1)).filter((i) => i >= 0)
  }

  function visibleFundSlots() {
    return activeSlots().filter((i) => balls[i].visible)
  }

  /** Funds that should ride the ring through test 2 (top three finalists plus anyone who fails later). */
  function ringSlots() {
    return activeSlots().filter((i) => {
      const outcome = states[i].outcome
      if (outcome === 1) return false
      if (outcome === null && !ranked.includes(ids[i])) return false
      return states[i].checked >= 1
    })
  }

  function pourDuration() {
    return Math.max(POUR_SECONDS, 0.25 + (activeCount - 1) * POUR_GAP + 1.45)
  }

  function test1Duration() {
    return 1.35 + activeCount * 0.14
  }

  function test2Duration() {
    const finalists = Math.max(ringSlots().length, counts[1] > 0 ? Math.min(counts[1], PODIUM_SIZE + 2) : 1)
    return 1.15 + finalists * 0.2
  }

  function pourComplete() {
    return activeSlots().every((i) => states[i].spawnAt < 0)
  }

  function test1Complete() {
    return visibleFundSlots().every((i) => states[i].checked >= 1)
  }

  function test2Complete() {
    const slots = ringSlots()
    return slots.length === 0 || slots.every((i) => states[i].checked >= 2)
  }

  function gateComplete() {
    const flyers = gateFlyers()
    return flyers.length === 0 || flyers.every((i) => states[i].checked >= 3)
  }

  function gateFlyers() {
    return activeSlots().filter((i) => {
      if (!balls[i].visible || !states[i].kin) return false
      if (states[i].outcome === 3) return true
      return states[i].outcome === null && ranked.includes(ids[i])
    })
  }

  function hideBenchBall(i: number) {
    balls[i].visible = false
    states[i].kin = false
    states[i].flightAt = -1
    states[i].path = null
    bodies[i].held = true
    states[i].mark.visible = false
  }

  function ejectFromBowl(i: number) {
    fail(i)
    const position = balls[i].position
    release(i, position.x * 0.55 + (random() - 0.5) * 0.35, 0.55 + random() * 0.35, position.z * 0.55 + (random() - 0.5) * 0.35)
  }

  /** Loads a category onto the ball pool: textures, outcomes and podium pillars. */
  function loadCategory(index: number) {
    categoryIndex = index
    const category = categories[index]
    const plan = planCategory(category.funds)
    counts = plan.counts
    activeCount = category.funds.length
    winners = plan.winners
    ranked = winners.slice(0, PODIUM_SIZE)
    bench = winners.slice(PODIUM_SIZE)
    ids = balls.map((_, i) => category.funds[i]?.id ?? '')
    outcomes = balls.map((_, i) => category.funds[i]?.failsAt ?? 1)
    balls.forEach((mesh, i) => {
      const fund = category.funds[i]
      const material = mesh.material as MeshPhysicalMaterial
      if (fund) {
        material.map = ballMap(fund.amc, fund.tag)
        material.needsUpdate = true
      }
      const state = states[i]
      Object.assign(state, {
        kin: false,
        path: null,
        outcome: outcomes[i],
        checked: 0,
        flightAt: -1,
        frontSlot: 0,
        dim: 0,
        dimTarget: 0,
        glow: 0,
        glowTarget: 0,
        scale: 1,
        scaleTarget: 1,
        markBirth: -1,
        draining: false,
        spawnAt: -1,
      })
      mesh.visible = false
    })
    podium.setWinners(ranked.map((id) => ({ id, score: category.funds.find((f) => f.id === id)!.score })))
    podium.raise(0)
    if (moreTexture) moreTexture.dispose()
    moreTexture = null
    if (bench.length) {
      const { texture, aspect } = labelTexture(`+${bench.length} more passed`)
      moreTexture = texture
      moreLabel.material.map = texture
      moreLabel.material.needsUpdate = true
      moreLabel.scale.set(0.2 * aspect, 0.2, 1)
    }
    moreTarget = 0
  }
  let slotCursor = 0
  let burstFired = false
  let spotTimer = 0
  let scroll = 0

  function toKin(i: number, target: (out: Vector3) => void, dur: number) {
    const state = states[i]
    bodies[i].held = true
    state.kin = true
    state.from.copy(balls[i].position)
    state.t0 = clock
    state.dur = dur
    state.target = target
    state.path = null
  }

  function fly(i: number, path: Path, dur: number) {
    toKin(i, () => {}, dur)
    states[i].path = path
    states[i].lastZ = balls[i].position.z
  }

  function release(i: number, vx: number, vy: number, vz: number) {
    const body = bodies[i]
    const position = balls[i].position
    body.x = position.x
    body.y = position.y
    body.z = position.z
    body.vx = vx
    body.vy = vy
    body.vz = vz
    body.held = false
    states[i].kin = false
    states[i].path = null
  }

  function mark(i: number, pass: boolean) {
    const state = states[i]
    const material = state.mark.material
    material.map = pass ? passMap : failMap
    material.needsUpdate = true
    state.markBirth = clock
  }

  function fail(i: number) {
    states[i].dimTarget = 1
    states[i].glowTarget = 0
    mark(i, false)
  }

  function ringTarget(slot: number, count: number) {
    return (out: Vector3) => ringSlot(slot, count, RING[0], spin, out)
  }

  function podiumTarget(rank: number, i: number) {
    return (out: Vector3) => podium.ballPoint(rank, states[i].scale, out)
  }

  function frontPoint(slot: number, count: number) {
    const spread = Math.min(compact ? 0.62 : 0.7, (compact ? 4.2 : 5.6) / Math.max(count - 1, 1))
    return new Vector3((slot - (count - 1) / 2) * spread, GATE.y - 0.1, GATE.z + 1.05)
  }

  function benchPoint(slot: number, count: number) {
    const spread = compact ? 0.52 : 0.6
    return new Vector3((slot - (count - 1) / 2) * spread, 0.45, -0.75)
  }

  function emit() {
    const category = categories[categoryIndex]
    options.onStage({
      stage,
      counts,
      winners,
      podium: ranked,
      category: {
        id: category.id,
        label: category.label,
        benchmark: category.benchmark,
        index: categoryIndex,
        total: categories.length,
      },
    })
  }

  function applySpotlight() {
    const spotId = ranked[podium.spotRank]
    ranked.forEach((id, rank) => {
      const i = ids.indexOf(id)
      if (i < 0) return
      states[i].scaleTarget = rank === podium.spotRank ? SPOT_SCALE : WINNER_SCALE
      states[i].dimTarget = rank === podium.spotRank ? 0 : 0.3
      states[i].glowTarget = rank === podium.spotRank ? 0.6 : 0.2
    })
    options.onSpotlight(spotId ?? null)
  }

  function enter(next: SieveStage) {
    stage = next
    stageTime = 0
    if (next === 'pour') {
      loadCategory(nextCategory ?? categoryIndex)
      stageLength = pourDuration()
      nextCategory = null
      const order = shuffle(
        ids.map((id, i) => (id ? i : -1)).filter((i) => i >= 0),
        random,
      )
      order.forEach((i, k) => {
        states[i].spawnAt = 0.15 + k * POUR_GAP
        bodies[i].held = true
      })
    }
    if (next === 'test1') {
      stageLength = test1Duration()
      slotCursor = 0
      options.onSpotlight(null)
    }
    if (next === 'test2') {
      stageLength = test2Duration()
      bench.forEach((id) => {
        const i = ids.indexOf(id)
        if (i >= 0) hideBenchBall(i)
      })
    }
    if (next === 'gate') {
      bench.forEach((id) => {
        const i = ids.indexOf(id)
        if (i >= 0) hideBenchBall(i)
      })
      const survivors = gateFlyers().sort((a, b) => balls[a].position.x - balls[b].position.x)
      const passers = survivors.filter((i) => states[i].outcome === null)
      survivors.forEach((i, order) => {
        states[i].flightAt = GATE_READY + order * FLIGHT_GAP
        states[i].frontSlot = passers.indexOf(i)
      })
      activeSlots().forEach((i) => {
        if (!survivors.includes(i) && states[i].kin) {
          states[i].kin = false
          states[i].flightAt = -1
          bodies[i].held = true
        }
      })
      stageLength = GATE_READY + survivors.length * FLIGHT_GAP + PASS_FLIGHT + 0.55
      gate.reset()
      gate.show()
    }
    if (next === 'podium') {
      stageLength = PODIUM_SECONDS
      burstFired = false
      podium.raise(1)
      podium.spotlight(0)
      gate.toHalo(1)
      bench.forEach((id) => {
        const i = ids.indexOf(id)
        if (i >= 0) hideBenchBall(i)
      })
      ranked.forEach((id, rank) => {
        const i = ids.indexOf(id)
        if (i < 0) return
        toKin(i, podiumTarget(rank, i), 1.2)
        states[i].scaleTarget = WINNER_SCALE
        states[i].glowTarget = 0.4
      })
      moreTarget = bench.length ? 1 : 0
    }
    if (next === 'spotlight') {
      stageLength = ranked.length === 1 ? SOLO_SPOT_SECONDS : SPOT_SECONDS * Math.max(ranked.length, 1)
      spotTimer = 0
      podium.spotlight(0)
      applySpotlight()
    }
    if (next === 'drain') {
      stageLength = DRAIN_SECONDS
      options.onSpotlight(null)
      podium.raise(0)
      gate.hide()
      moreTarget = 0
      nextCategory ??= (categoryIndex + 1) % categories.length
      balls.forEach((mesh, i) => {
        if (!mesh.visible) return
        const start = mesh.position.clone()
        const end = new Vector3(start.x * 0.25, -BOWL_RADIUS - 1.4, start.z * 0.25)
        toKin(i, (out) => out.copy(end), 1.05 + random() * 0.45)
        states[i].from.copy(start)
        states[i].draining = true
        states[i].markBirth = -1
        states[i].glowTarget = 0
      })
    }
    emit()
  }

  function runTest1() {
    const sweepSpan = 1.55 + activeCount * 0.1
    const sweep = clamp01((stageTime - 0.2) / sweepSpan)
    const scanY = 0.45 - (0.45 + BOWL_RADIUS) * sweep
    scan.visible = sweep > 0 && sweep < 1
    const radius = scanY >= 0 ? BOWL_RADIUS + 0.03 : Math.sqrt(Math.max(BOWL_RADIUS ** 2 - scanY ** 2, 0.01))
    scan.position.y = scanY
    scan.scale.set(radius, 1, radius)
    states.forEach((state, i) => {
      if (state.checked >= 1 || state.kin || !balls[i].visible) return
      if (balls[i].position.y < scanY && sweep < 1) return
      state.checked = 1
      if (state.outcome === 1) {
        ejectFromBowl(i)
        return
      }
      mark(i, true)
      state.glowTarget = 1
      const ringCount = Math.max(counts[1], Math.min(PODIUM_SIZE + 2, slotCursor + 1))
      toKin(i, ringTarget(slotCursor, ringCount), 1.1)
      slotCursor += 1
    })
  }

  function runTest2() {
    const sweepSpan = 1.55 + ringSlots().length * 0.16
    const sweep = clamp01((stageTime - 0.2) / sweepSpan) * TAU * 1.15
    const start = Math.PI / 2
    const angle = start + sweep
    beamGroup.visible = sweep > 0 && sweep < TAU * 1.15
    beamGroup.position.set(Math.cos(angle) * RING[0].radius, RING[0].y, Math.sin(angle) * RING[0].radius)
    states.forEach((state, i) => {
      if (!state.kin || state.checked >= 2 || !balls[i].visible) return
      if (state.outcome === null && !ranked.includes(ids[i])) return
      const position = balls[i].position
      const relative = (((Math.atan2(position.z, position.x) - start) % TAU) + TAU) % TAU
      if (sweep < relative && sweep < TAU * 1.15) return
      state.checked = 2
      if (state.outcome === 2) {
        fail(i)
        release(i, -position.x * 0.35, 0.8, -position.z * 0.35)
      } else {
        mark(i, true)
      }
    })
  }

  function launch(i: number) {
    const state = states[i]
    const passes = state.outcome === null
    const p0 = balls[i].position.clone()
    const p1 = new Vector3(p0.x * 0.7, p0.y + 1, GATE.z - 1.5)
    const p2 = new Vector3(p0.x * 0.15, GATE.y, GATE.z - 0.9)
    const p3 = passes ? frontPoint(state.frontSlot, counts[3]) : new Vector3(0, GATE.y, GATE.z - 0.18)
    fly(i, (t, out) => cubicBezier(t, p0, p1, p2, p3, out), passes ? PASS_FLIGHT : FAIL_FLIGHT)
  }

  function runGate() {
    states.forEach((state, i) => {
      if (state.flightAt < 0 || state.checked >= 3) return
      if (!state.path && stageTime >= state.flightAt) launch(i)
      if (!state.path) return
      const z = balls[i].position.z
      const done = clock - state.t0 >= state.dur
      if (state.outcome === null && ((state.lastZ < GATE.z && z >= GATE.z) || done)) {
        state.checked = 3
        gate.pulse(true)
        mark(i, true)
        state.glowTarget = 1
        state.dimTarget = 0
      } else if (state.outcome !== null && done) {
        state.checked = 3
        gate.pulse(false)
        fail(i)
        release(i, (random() - 0.5) * 0.6, 1.1, -2.2)
      }
      state.lastZ = z
    })
  }

  function runSpotlight(dt: number) {
    if (ranked.length < 2) return
    spotTimer += dt
    if (spotTimer >= SPOT_SECONDS) {
      spotTimer = 0
      podium.spotlight((podium.spotRank + 1) % ranked.length)
      applySpotlight()
    }
  }

  function runPour(dt: number) {
    states.forEach((state, i) => {
      if (state.spawnAt < 0 || stageTime < state.spawnAt) return
      state.spawnAt = -1
      const body = bodies[i]
      const angle = random() * TAU
      const radius = random() * 1.1
      body.x = Math.cos(angle) * radius
      body.z = Math.sin(angle) * radius
      body.y = 3 + random() * 0.8
      body.vx = (random() - 0.5) * 0.6
      body.vy = -2.5
      body.vz = (random() - 0.5) * 0.6
      body.held = false
      balls[i].position.set(body.x, body.y, body.z)
      balls[i].visible = true
    })
    if (stageTime > 1.7) stir(bodies, dt, compact ? 2.6 : 3.2)
  }

  function advance(dt: number) {
    stageTime += dt
    if (stage === 'pour') runPour(dt)
    if (stage === 'test1') runTest1()
    if (stage === 'test2') runTest2()
    if (stage === 'gate') runGate()
    if (stage === 'podium' && !burstFired && stageTime >= BURST_AT) {
      burstFired = true
      podium.burst()
    }
    if (stage === 'spotlight') runSpotlight(dt)
    const stageReady =
      stage === 'pour'
        ? pourComplete() && stageTime >= stageLength
        : stage === 'test1'
          ? test1Complete() && stageTime >= stageLength
          : stage === 'test2'
            ? test2Complete() && stageTime >= stageLength
            : stage === 'gate'
              ? gateComplete() && stageTime >= stageLength
              : stageTime >= stageLength
    if (stageReady) {
      scan.visible = false
      beamGroup.visible = false
      const next = NEXT_STAGE[stage]
      enter(next === 'podium' && !winners.length ? 'drain' : next)
    }
  }

  function gateTime() {
    if (stage === 'gate') return stageTime
    return stage === 'podium' || stage === 'spotlight' || stage === 'drain' ? 99 : -1
  }

  function updateBalls(dt: number) {
    const ease = 1 - Math.exp(-dt * 6)
    states.forEach((state, i) => {
      const mesh = balls[i]
      if (state.kin) {
        const t = clamp01((clock - state.t0) / state.dur)
        if (state.path) {
          state.path(easeInOut(t), mesh.position)
        } else {
          state.target(tmp)
          mesh.position.lerpVectors(state.from, tmp, easeInOut(t))
        }
        facing.position.copy(mesh.position)
        facing.lookAt(camera.position)
        mesh.quaternion.slerp(facing.quaternion, 1 - Math.exp(-dt * 5))
      } else {
        const body = bodies[i]
        mesh.position.set(body.x, body.y, body.z)
        if (state.dimTarget > 0.45 && body.y < -BOWL_RADIUS - 0.35 && !state.draining) {
          mesh.visible = false
        }
        const speed = Math.hypot(body.vx, body.vz)
        if (speed > 0.001 && dt > 0) {
          axis.set(body.vz, 0, -body.vx).normalize()
          roll.setFromAxisAngle(axis, (speed * dt) / BALL_RADIUS)
          mesh.quaternion.premultiply(roll)
        }
      }
      state.dim += (state.dimTarget - state.dim) * ease
      state.glow += (state.glowTarget - state.glow) * ease
      state.scale += (state.scaleTarget - state.scale) * ease
      const material = mesh.material as MeshPhysicalMaterial
      material.color.setScalar(1 - 0.7 * state.dim)
      material.roughness = 0.3 + 0.35 * state.dim
      material.clearcoat = 1 - 0.8 * state.dim
      material.envMapIntensity = 1 - 0.6 * state.dim
      material.emissive.copy(state.checked >= 3 ? gold : primary).multiplyScalar(0.12 * state.glow)
      if (state.draining) {
        const t = clamp01((clock - state.t0) / state.dur)
        mesh.scale.setScalar(Math.max(state.scale * (1 - t * t), 0.001))
        if (t >= 1) mesh.visible = false
      } else {
        mesh.scale.setScalar(state.scale)
      }

      const markMaterial = state.mark.material
      const age = state.markBirth < 0 ? -1 : clock - state.markBirth
      const opacity = age < 0 ? 0 : age < 0.2 ? age / 0.2 : age > 1.5 ? Math.max(0, 1 - (age - 1.5) / 0.4) : 1
      state.mark.visible = opacity > 0.01
      markMaterial.opacity = opacity
      state.mark.position.set(mesh.position.x, mesh.position.y + BALL_RADIUS * state.scale + 0.2, mesh.position.z)
    })
  }

  function resize() {
    const width = container.clientWidth
    const height = container.clientHeight
    renderer.setSize(width, height, false)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    camera.aspect = width / Math.max(height, 1)
    if (width >= 1024) camera.setViewOffset(width, height, -width * 0.035, 0, width, height)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }

  function render(elapsed: number) {
    parallax.lerp(pointer, 0.04)
    const dolly = 1 - scroll * 0.22
    camera.position.set(
      cameraBase.x + parallax.x * 0.9,
      cameraBase.y - parallax.y * 0.5 - scroll * 0.8,
      cameraBase.z * dolly,
    )
    tmp.copy(lookTarget)
    tmp.y -= scroll * 0.5
    camera.lookAt(tmp)
    dustPoints.rotation.y = elapsed * 0.02
    dustPoints.position.y = Math.sin(elapsed * 0.3) * 0.15
    renderer.render(scene, camera)
  }

  function showStatic(index: number) {
    loadCategory(index)
    balls.forEach((mesh, i) => {
      if (!ids[i]) return
      mesh.visible = true
      const rest = restPositions[i]
      Object.assign(bodies[i], { ...rest, vx: 0, vy: 0, vz: 0, held: false })
      const state = states[i]
      if (state.outcome !== null) state.dimTarget = 1
      else state.checked = 3
    })
    podium.raise(1)
    podium.snap()
    gate.show()
    gate.toHalo(1)
    gate.snap()
    ranked.forEach((id, rank) => {
      const i = ids.indexOf(id)
      if (i < 0) return
      toKin(i, podiumTarget(rank, i), 1)
      states[i].t0 = -10
      states[i].scale = WINNER_SCALE
    })
    bench.forEach((id) => {
      const i = ids.indexOf(id)
      if (i >= 0) hideBenchBall(i)
    })
    moreTarget = bench.length ? 1 : 0
    stage = 'spotlight'
    podium.spotlight(0)
    camera.position.copy(cameraBase)
    emit()
    applySpotlight()
  }

  function updateMoreLabel(dt: number) {
    const material = moreLabel.material
    material.opacity += (moreTarget - material.opacity) * (1 - Math.exp(-dt * 4))
    moreLabel.visible = material.opacity > 0.01 && moreTexture !== null
    if (!bench.length) return
    const first = benchPoint(0, bench.length)
    moreLabel.position.set(first.x - 0.4 - moreLabel.scale.x / 2, first.y, first.z)
  }

  let frame = 0
  let visible = true
  let last = performance.now()
  const clockStart = last

  const loop = (now: number) => {
    frame = requestAnimationFrame(loop)
    const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20))
    last = now
    if (!visible || document.hidden) return
    const elapsed = (now - clockStart) / 1000
    if (options.reduceMotion) {
      updateBalls(1)
      updateMoreLabel(1)
      gate.update(99, 1, 0)
      podium.update(1, true)
      render(0)
      return
    }
    clock += dt
    spin += dt * 0.3
    step(bodies, dt)
    advance(dt)
    updateBalls(dt)
    updateMoreLabel(dt)
    gate.update(gateTime(), dt, elapsed)
    podium.update(dt, stage === 'spotlight')
    render(elapsed)
  }

  const onPointer = (event: PointerEvent) => {
    pointer.set(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5)
  }
  const onTheme = new MutationObserver(() => {
    const next = cssColor('--primary', '#22c55e')
    primary.copy(next)
    rimMaterial.color.copy(next)
    rimMaterial.emissive.copy(next)
    rimLight.color.copy(next)
    ;[dustMaterial, scanMaterial, scanDiscMaterial, beamMaterial, beamGlowMaterial].forEach((m) => m.color.copy(next))
  })
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  })
  const sizeObserver = new ResizeObserver(resize)

  resize()
  updateBalls(0)
  if (options.reduceMotion) showStatic(0)
  else enter('pour')
  sizeObserver.observe(container)
  visibility.observe(container)
  onTheme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  window.addEventListener('pointermove', onPointer, { passive: true })
  frame = requestAnimationFrame(loop)

  return {
    setScroll(progress: number) {
      scroll = clamp01(progress)
    },
    setSpotlight(fundId: string) {
      const rank = ranked.indexOf(fundId)
      if (rank < 0 || stage !== 'spotlight' || rank === podium.spotRank) return
      podium.spotlight(rank)
      spotTimer = 0
      stageTime = Math.min(stageTime, stageLength - SPOT_SECONDS)
      applySpotlight()
    },
    setCategory(index: number) {
      if (index === categoryIndex && stage !== 'drain' && !options.reduceMotion) return
      if (options.reduceMotion) {
        showStatic(index)
        return
      }
      nextCategory = index
      if (stage !== 'drain') enter('drain')
    },
    dispose() {
      cancelAnimationFrame(frame)
      sizeObserver.disconnect()
      visibility.disconnect()
      onTheme.disconnect()
      window.removeEventListener('pointermove', onPointer)
      podium.dispose()
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Points || object instanceof Sprite) {
          object.geometry.dispose()
          const material = object.material as { dispose?: () => void }
          material.dispose?.()
        }
      })
      moreTexture?.dispose()
      ;[...ballMaps.values(), ...gate.textures, passMap, failMap, glowMap, shadowMap, environment].forEach((t) =>
        t.dispose(),
      )
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
