import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Amc } from './amcs'

const WIDTH = 1024
const HEIGHT = 512

/**
 * Equirectangular texture with the monogram at u = 0.25 and u = 0.75,
 * so it faces +z (the camera) when the ball's rotation is identity.
 */
export function createBallTexture(amc: Amc, maxAnisotropy: number, tag = '') {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  gradient.addColorStop(0, shade(amc.color, 0.25))
  gradient.addColorStop(0.5, amc.color)
  gradient.addColorStop(1, shade(amc.color, -0.35))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fillRect(0, HEIGHT * 0.36, WIDTH, 3)
  ctx.fillRect(0, HEIGHT * 0.64 - 3, WIDTH, 3)

  const fontSize = amc.label.length > 5 ? 58 : amc.label.length > 4 ? 70 : 86
  ctx.font = `800 ${fontSize}px Inter, "Segoe UI", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = amc.ink
  const labelY = tag ? HEIGHT / 2 - 16 : HEIGHT / 2 + 2
  for (const x of [WIDTH * 0.25, WIDTH * 0.75]) {
    ctx.fillText(amc.label, x, labelY)
  }
  if (tag) {
    ctx.font = `700 34px Inter, "Segoe UI", system-ui, sans-serif`
    for (const x of [WIDTH * 0.25, WIDTH * 0.75]) {
      ctx.fillText(tag, x, HEIGHT / 2 + 42)
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = Math.min(8, maxAnisotropy)
  return texture
}

function shade(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16)
  const channel = (shift: number) => {
    const c = (value >> shift) & 255
    const next = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)
    return Math.round(Math.max(0, Math.min(255, next)))
  }
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}
