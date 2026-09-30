import { BufferAttribute, BufferGeometry, CanvasTexture, Color, LatheGeometry, SRGBColorSpace, Vector2 } from 'three'
import { BOWL_RADIUS } from './physics'

export function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

/** Resolves any CSS colour (including oklch) to a three.js Color via a 1px canvas. */
export function cssColor(variable: string, fallback: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return new Color(`rgb(${r}, ${g}, ${b})`)
}

export function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function clamp01(t: number) {
  return Math.max(0, Math.min(1, t))
}

export function bowlGeometry() {
  const inner = BOWL_RADIUS + 0.02
  const outer = BOWL_RADIUS + 0.1
  const points: Vector2[] = []
  for (let i = 0; i <= 40; i += 1) {
    const a = (i / 40) * (Math.PI / 2)
    points.push(new Vector2(Math.sin(a) * inner, -Math.cos(a) * inner))
  }
  for (let i = 40; i >= 0; i -= 1) {
    const a = (i / 40) * (Math.PI / 2)
    points.push(new Vector2(Math.sin(a) * outer, -Math.cos(a) * outer))
  }
  return new LatheGeometry(points, 96)
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  draw(canvas.getContext('2d')!)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function shadowTexture() {
  return canvasTexture(256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
  })
}

export function glowTexture() {
  return canvasTexture(128, (ctx) => {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.25)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  })
}

/** Round badge with a tick (pass) or a cross (fail). */
export function markTexture(pass: boolean) {
  return canvasTexture(128, (ctx) => {
    ctx.fillStyle = pass ? '#16a34a' : '#dc2626'
    ctx.beginPath()
    ctx.arc(64, 64, 56, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 13
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    if (pass) {
      ctx.moveTo(38, 66)
      ctx.lineTo(56, 84)
      ctx.lineTo(90, 46)
    } else {
      ctx.moveTo(44, 44)
      ctx.lineTo(84, 84)
      ctx.moveTo(84, 44)
      ctx.lineTo(44, 84)
    }
    ctx.stroke()
  })
}

/** Pill-shaped text label; the returned aspect is width / height for sprite scaling. */
export function labelTexture(text: string, accent = '#e8b04b') {
  const height = 64
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = '600 30px ui-monospace, SFMono-Regular, Menlo, monospace'
  const width = Math.ceil(measure.measureText(text).width) + 44
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(8, 14, 12, 0.72)'
  ctx.beginPath()
  ctx.roundRect(2, 2, width - 4, height - 4, (height - 4) / 2)
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.font = measure.font
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2 + 1)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return { texture, aspect: width / height }
}

export function dustGeometry(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (random() - 0.5) * 22
    positions[i * 3 + 1] = (random() - 0.3) * 10
    positions[i * 3 + 2] = (random() - 0.7) * 14
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return geometry
}
