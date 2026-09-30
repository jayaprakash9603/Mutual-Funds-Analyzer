/**
 * Minimal ball-in-bowl simulation: spheres under gravity inside the lower half of a
 * sphere (the bowl), with an invisible cylinder above the rim so tossed balls fall back in.
 */
export type Body = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  /** Excluded from simulation while it is being presented. */
  held: boolean
}

export const BOWL_RADIUS = 2.2
export const BALL_RADIUS = 0.3

const GRAVITY = -11
const WALL_BOUNCE = 0.42
const BALL_BOUNCE = 0.55
const WALL_FRICTION = 0.985
const AIR_DRAG = 0.9985
const SUBSTEPS = 4
const LIMIT = BOWL_RADIUS - BALL_RADIUS

export function createBodies(count: number, random: () => number): Body[] {
  return Array.from({ length: count }, (_, i) => {
    const ring = Math.floor(i / 6)
    const angle = (i % 6) * ((Math.PI * 2) / 6) + ring * 0.5
    const spread = 0.55 + ring * 0.35
    return {
      x: Math.cos(angle) * spread + (random() - 0.5) * 0.1,
      y: -LIMIT + 0.4 + ring * 0.7,
      z: Math.sin(angle) * spread + (random() - 0.5) * 0.1,
      vx: 0,
      vy: 0,
      vz: 0,
      held: false,
    }
  })
}

function constrainToBowl(b: Body) {
  if (b.y < 0) {
    const dist = Math.hypot(b.x, b.y, b.z)
    if (dist <= LIMIT) return
    const nx = b.x / dist
    const ny = b.y / dist
    const nz = b.z / dist
    b.x = nx * LIMIT
    b.y = ny * LIMIT
    b.z = nz * LIMIT
    const vn = b.vx * nx + b.vy * ny + b.vz * nz
    if (vn > 0) {
      b.vx = (b.vx - vn * nx) * WALL_FRICTION - vn * nx * WALL_BOUNCE
      b.vy = (b.vy - vn * ny) * WALL_FRICTION - vn * ny * WALL_BOUNCE
      b.vz = (b.vz - vn * nz) * WALL_FRICTION - vn * nz * WALL_BOUNCE
    }
    return
  }
  const radial = Math.hypot(b.x, b.z)
  if (radial <= LIMIT) return
  const nx = b.x / radial
  const nz = b.z / radial
  b.x = nx * LIMIT
  b.z = nz * LIMIT
  const vn = b.vx * nx + b.vz * nz
  if (vn > 0) {
    b.vx -= vn * nx * (1 + WALL_BOUNCE)
    b.vz -= vn * nz * (1 + WALL_BOUNCE)
  }
}

function collide(a: Body, b: Body) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dz = b.z - a.z
  const distSq = dx * dx + dy * dy + dz * dz
  const min = BALL_RADIUS * 2
  if (distSq >= min * min || distSq === 0) return
  const dist = Math.sqrt(distSq)
  const nx = dx / dist
  const ny = dy / dist
  const nz = dz / dist
  const push = (min - dist) / 2
  a.x -= nx * push
  a.y -= ny * push
  a.z -= nz * push
  b.x += nx * push
  b.y += ny * push
  b.z += nz * push
  const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz
  if (closing >= 0) return
  const impulse = (-(1 + BALL_BOUNCE) * closing) / 2
  a.vx -= impulse * nx
  a.vy -= impulse * ny
  a.vz -= impulse * nz
  b.vx += impulse * nx
  b.vy += impulse * ny
  b.vz += impulse * nz
}

export function step(bodies: Body[], dt: number) {
  if (dt <= 0) return
  const h = Math.min(dt, 1 / 30) / SUBSTEPS
  for (let s = 0; s < SUBSTEPS; s += 1) {
    for (const b of bodies) {
      if (b.held) continue
      b.vy += GRAVITY * h
      b.vx *= AIR_DRAG
      b.vy *= AIR_DRAG
      b.vz *= AIR_DRAG
      b.x += b.vx * h
      b.y += b.vy * h
      b.z += b.vz * h
    }
    for (let i = 0; i < bodies.length; i += 1) {
      if (bodies[i].held) continue
      for (let j = i + 1; j < bodies.length; j += 1) {
        if (!bodies[j].held) collide(bodies[i], bodies[j])
      }
    }
    for (const b of bodies) if (!b.held) constrainToBowl(b)
  }
}

/** Gentle tangential push around the bowl's axis, like a spoon stirring. */
export function stir(bodies: Body[], dt: number, strength: number) {
  for (const b of bodies) {
    if (b.held) continue
    const radial = Math.hypot(b.x, b.z) + 0.05
    b.vx += (-b.z / radial) * strength * dt
    b.vz += (b.x / radial) * strength * dt
  }
}
