import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePickedFund } from './pickedFund'

const CONTENT_MAX = 1344
const CONTENT_PADDING = 32

type Point = { x: number; y: number }
type Geometry = { width: number; top: number; height: number; d: string; markers: (Point & { label: string })[] }

function relative(root: DOMRect, el: Element): Point {
  const rect = el.getBoundingClientRect()
  return { x: rect.left - root.left, y: rect.top - root.top }
}

/** Runs down the page gutter, wiggling with the fund's period returns, from the hero card to the showcase chart. */
function buildGeometry(width: number, start: Point, end: Point, series: number[], years: [number, number]): Geometry {
  const contentRight = (width + Math.min(width, CONTENT_MAX)) / 2 - CONTENT_PADDING
  const gutter = contentRight + (width - contentRight) / 2
  const amplitude = Math.min(26, (width - contentRight) / 2 - 6)
  const topY = start.y + 110
  const bottomY = end.y - 90

  const returns = series.slice(1).map((value, i) => Math.log(value / series[i]))
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const spread = Math.max(...returns.map((r) => Math.abs(r - mean))) || 1
  const points = returns.map((r, i) => ({
    x: gutter - ((r - mean) / spread) * amplitude,
    y: topY + ((bottomY - topY) * i) / (returns.length - 1),
  }))

  const first = points[0]
  const last = points[points.length - 1]
  let d = `M${start.x},${start.y} C${start.x},${start.y + 70} ${gutter},${topY - 70} ${first.x},${first.y}`
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const midX = (prev.x + points[i].x) / 2
    const midY = (prev.y + points[i].y) / 2
    d += ` Q${prev.x},${prev.y} ${midX},${midY}`
  }
  d += ` L${last.x},${last.y} C${last.x},${bottomY + 60} ${end.x + 80},${end.y - 50} ${end.x},${end.y}`

  const markers = [0, 0.33, 0.66, 1].map((t) => {
    const point = points[Math.round(t * (points.length - 1))]
    return { ...point, label: String(Math.round(years[0] + (years[1] - years[0]) * t)) }
  })

  const top = start.y - 20
  const height = end.y - top + 20
  const shift = (p: Point & { label: string }) => ({ ...p, y: p.y - top })
  return { width, top, height, d: shiftPath(d, top), markers: markers.map(shift) }
}

function shiftPath(d: string, top: number) {
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${x},${(Number(y) - top).toFixed(1)}`)
}

export function FlowLine({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const { pick } = usePickedFund()
  const reduceMotion = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const gradientId = `flow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const headX = useMotionValue(0)
  const headY = useMotionValue(0)
  const enabled = desktop && !reduceMotion && Boolean(pick)

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ['start 0.6', 'end 0.8'] })
  const headOpacity = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0])

  useEffect(() => {
    const root = rootRef.current
    if (!enabled || !root || !pick) return
    const measure = () => {
      const start = root.querySelector('[data-flow-start]')
      const end = root.querySelector('[data-flow-end]')
      if (!start || !end) return
      const rootRect = root.getBoundingClientRect()
      setGeometry(
        buildGeometry(root.clientWidth, relative(rootRect, start), relative(rootRect, end), pick.fund, [
          pick.startYear,
          pick.endYear,
        ]),
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [enabled, pick, rootRef])

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const path = pathRef.current
    if (!path) return
    const point = path.getPointAtLength(path.getTotalLength() * value)
    headX.set(point.x)
    headY.set(point.y)
  })

  if (!enabled || !geometry) return <div ref={wrapperRef} className="pointer-events-none absolute left-0 top-0 hidden" aria-hidden />

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none absolute left-0 z-[5]"
      style={{ top: geometry.top, width: geometry.width, height: geometry.height }}
      aria-hidden
    >
      <svg className="size-full overflow-visible" viewBox={`0 0 ${geometry.width} ${geometry.height}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2={geometry.height} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="70%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <path d={geometry.d} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="2 6" />
        <motion.path
          ref={pathRef}
          d={geometry.d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={2}
          strokeLinecap="round"
          style={{
            pathLength: scrollYProgress,
            filter: 'drop-shadow(0 0 6px color-mix(in oklch, var(--primary) 60%, transparent))',
          }}
        />
        {geometry.markers.map((marker, i) => (
          <Marker
            key={marker.label}
            marker={marker}
            at={i / (geometry.markers.length - 1)}
            progress={scrollYProgress}
          />
        ))}
        <motion.g style={{ opacity: headOpacity }}>
          <motion.circle r={5} cx={headX} cy={headY} fill="var(--primary)" />
          <motion.circle r={12} cx={headX} cy={headY} fill="var(--primary)" opacity={0.18} />
        </motion.g>
      </svg>
    </div>
  )
}

type MarkerProps = {
  marker: Point & { label: string }
  at: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}

function Marker({ marker, at, progress }: MarkerProps) {
  const [shown, setShown] = useState(false)
  useMotionValueEvent(progress, 'change', (value) => setShown(value > 0.01 && value >= at * 0.92))
  return (
    <motion.g initial={false} animate={{ opacity: shown ? 1 : 0, x: shown ? 0 : 6 }} transition={{ duration: 0.5 }}>
      <circle cx={marker.x} cy={marker.y} r={3} fill="var(--background)" stroke="var(--primary)" strokeWidth={1.5} />
      <text
        x={marker.x - 12}
        y={marker.y + 4}
        textAnchor="end"
        className="fill-muted-foreground font-mono text-[10px] tracking-[0.12em]"
      >
        {marker.label}
      </text>
    </motion.g>
  )
}
