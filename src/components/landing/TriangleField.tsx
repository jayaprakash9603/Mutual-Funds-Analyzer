import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number; z: number; kind: 'edge' | 'face' | 'corner' }

const DEPTH = 0.42

function trianglePrism(edgeDensity: number, faceCount: number) {
  const corners = [0, 1, 2].map((i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 3
    return { x: Math.cos(angle), y: Math.sin(angle) }
  })
  const points: Point[] = []

  for (const z of [-DEPTH, DEPTH]) {
    corners.forEach((a, i) => {
      const b = corners[(i + 1) % 3]
      for (let s = 0; s < edgeDensity; s += 1) {
        const t = s / edgeDensity
        points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z, kind: 'edge' })
      }
      points.push({ x: a.x, y: a.y, z, kind: 'corner' })
    })
  }

  corners.forEach((c) => {
    for (let s = 1; s < edgeDensity / 2; s += 1) {
      points.push({ x: c.x, y: c.y, z: -DEPTH + (2 * DEPTH * s) / (edgeDensity / 2), kind: 'edge' })
    }
  })

  let seed = 7
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < faceCount; i += 1) {
    let u = random()
    let v = random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const [a, b, c] = corners
    points.push({
      x: a.x + u * (b.x - a.x) + v * (c.x - a.x),
      y: a.y + u * (b.y - a.y) + v * (c.y - a.y),
      z: (random() * 2 - 1) * DEPTH,
      kind: 'face',
    })
  }
  return points
}

function readColors(el: HTMLElement) {
  const styles = getComputedStyle(el)
  return {
    primary: styles.getPropertyValue('--primary').trim() || '#22c55e',
    gold: styles.getPropertyValue('--gold').trim() || '#e8b04b',
    ink: styles.getPropertyValue('--foreground').trim() || '#e5e7eb',
  }
}

export function TriangleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(max-width: 1023px)').matches
    const points = trianglePrism(compact ? 70 : 110, compact ? 260 : 520)
    let colors = readColors(document.documentElement)
    let width = 0
    let height = 0
    let visible = true
    let frame = 0
    const pointer = { x: 0, y: 0 }
    const tilt = { x: 0, y: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onPointer = (event: PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth - 0.5
      pointer.y = event.clientY / window.innerHeight - 0.5
    }

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw)
      if (!visible) return
      const time = reduceMotion ? 0 : now
      tilt.x += (pointer.y * 0.6 - tilt.x) * 0.05
      tilt.y += (pointer.x * 0.9 - tilt.y) * 0.05

      const angleY = time * 0.00018 + tilt.y
      const angleX = -0.25 + tilt.x
      const sinY = Math.sin(angleY)
      const cosY = Math.cos(angleY)
      const sinX = Math.sin(angleX)
      const cosX = Math.cos(angleX)
      const cx = width * 0.5
      const cy = height * 0.52
      const radius = Math.min(width, height) * 0.36

      ctx.clearRect(0, 0, width, height)

      for (const p of points) {
        const breathe = p.kind === 'face' ? 1 + 0.05 * Math.sin(time * 0.0015 + p.x * 6 + p.z * 9) : 1
        const x = p.x * breathe
        const y = p.y * breathe
        const x1 = x * cosY - p.z * sinY
        const z1 = x * sinY + p.z * cosY
        const y1 = y * cosX - z1 * sinX
        const z2 = y * sinX + z1 * cosX
        const perspective = 2.6 / (2.6 + z2)
        const depth = (1 - z2) / 2

        ctx.globalAlpha =
          p.kind === 'face' ? 0.08 + depth * 0.35 : p.kind === 'corner' ? 1 : 0.25 + depth * 0.75
        ctx.fillStyle = p.kind === 'corner' ? colors.gold : p.kind === 'edge' ? colors.primary : colors.ink
        ctx.beginPath()
        ctx.arc(
          cx + x1 * radius * perspective,
          cy + y1 * radius * perspective,
          (p.kind === 'corner' ? 4.5 : p.kind === 'edge' ? 1.5 : 1.1) * perspective,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }

      const orbit = time * 0.0005
      const ringTilt = -0.3 + tilt.y * 0.2
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = colors.gold
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(cx, cy, radius * 1.45, radius * 0.32, ringTilt, 0, Math.PI * 2)
      ctx.stroke()
      const ox = Math.cos(orbit) * radius * 1.45
      const oy = Math.sin(orbit) * radius * 0.32
      ctx.globalAlpha = 1
      ctx.fillStyle = colors.gold
      ctx.beginPath()
      ctx.arc(
        cx + ox * Math.cos(ringTilt) - oy * Math.sin(ringTilt),
        cy + ox * Math.sin(ringTilt) + oy * Math.cos(ringTilt),
        3.5,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    const theme = new MutationObserver(() => {
      colors = readColors(document.documentElement)
    })

    resize()
    visibility.observe(canvas)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      visibility.disconnect()
      theme.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  return <canvas ref={canvasRef} className={cn('pointer-events-none', className)} aria-hidden="true" />
}
