/** The test (1, 2 or 3) a ball is eliminated at, or null when it passes all three. */
export type Outcome = 1 | 2 | 3 | null

export type SieveStage = 'pour' | 'test1' | 'test2' | 'gate' | 'podium' | 'spotlight' | 'drain'

export const STAGE_ORDER: SieveStage[] = ['pour', 'test1', 'test2', 'gate', 'podium', 'spotlight', 'drain']

export const PODIUM_SIZE = 3

export type SceneFund = { id: string; amc: string; tag: string; failsAt: Outcome; score: number }

export type SceneCategory = { id: string; label: string; benchmark: string; funds: SceneFund[] }

export type StageEvent = {
  stage: SieveStage
  /** Balls in contention: before test 1, after test 1, after test 2, after test 3. */
  counts: [number, number, number, number]
  /** Fund ids passing all three rules, best 5-year rolling average first. */
  winners: string[]
  /** The winners standing on the podium (at most three). */
  podium: string[]
  category: { id: string; label: string; benchmark: string; index: number; total: number }
}

type Point = { x: number; y: number; z: number }

export const RING = [{ radius: 1.55, y: 0.95 }] as const

export function cubicBezier<T extends Point>(t: number, p0: Point, p1: Point, p2: Point, p3: Point, out: T) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  out.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x
  out.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y
  out.z = a * p0.z + b * p1.z + c * p2.z + d * p3.z
  return out
}

export function shuffle<T>(items: T[], random: () => number) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function planCategory(funds: SceneFund[]) {
  const failing = (stage: 1 | 2 | 3) => funds.filter((f) => f.failsAt === stage).length
  const total = funds.length
  const afterOne = total - failing(1)
  const afterTwo = afterOne - failing(2)
  const counts: StageEvent['counts'] = [total, afterOne, afterTwo, afterTwo - failing(3)]
  const winners = funds
    .filter((f) => f.failsAt === null)
    .sort((a, b) => b.score - a.score)
    .map((f) => f.id)
  return { counts, winners }
}

export function ringSlot<T extends Point>(slot: number, count: number, ring: (typeof RING)[number], spin: number, out: T) {
  const angle = (slot / Math.max(count, 1)) * Math.PI * 2 + spin
  out.x = Math.cos(angle) * ring.radius
  out.y = ring.y
  out.z = Math.sin(angle) * ring.radius
  return out
}
