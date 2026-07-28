import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 480
const PADDING = { top: 30, right: 18, bottom: 30, left: 18 }
const STEPS = 61
const BASE_INVESTMENT = 100_000

/**
 * Sample series only. Shapes are generated from a fixed seed so the hero renders
 * identically on every load; they are not sourced from live NAV data.
 */
function buildSeries(seed: number, drift: number, volatility: number) {
  let state = seed
  let level = 100
  const levels = [level]
  for (let step = 1; step < STEPS; step += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296
    const shock = (state / 4294967296 - 0.5) * volatility
    level *= 1 + drift + shock
    levels.push(level)
  }
  return levels
}

function toCoordinates(levels: number[], floor: number, ceiling: number) {
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom
  const stepX = plotWidth / (levels.length - 1)
  return levels.map((level, index) => ({
    x: PADDING.left + index * stepX,
    y: PADDING.top + plotHeight - ((level - floor) / (ceiling - floor)) * plotHeight,
  }))
}

function toLinePath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ')
}

const currency = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export function PerformanceCurve() {
  const reduceMotion = useReducedMotion()

  const chart = useMemo(() => {
    const fundLevels = buildSeries(20130104, 0.0237, 0.055)
    const benchmarkLevels = buildSeries(19960329, 0.0183, 0.044)
    const combined = [...fundLevels, ...benchmarkLevels]
    const floor = Math.min(...combined) * 0.94
    const ceiling = Math.max(...combined) * 1.04

    const fundPoints = toCoordinates(fundLevels, floor, ceiling)
    const benchmarkPoints = toCoordinates(benchmarkLevels, floor, ceiling)
    const fundLine = toLinePath(fundPoints)
    const marker = fundPoints[fundPoints.length - 1]

    return {
      fundLine,
      benchmarkLine: toLinePath(benchmarkPoints),
      fundArea: `${fundLine} L${marker.x.toFixed(2)},${VIEW_HEIGHT} L${PADDING.left},${VIEW_HEIGHT} Z`,
      marker,
      fundValue: (BASE_INVESTMENT * fundLevels[fundLevels.length - 1]) / 100,
      benchmarkValue: (BASE_INVESTMENT * benchmarkLevels[benchmarkLevels.length - 1]) / 100,
    }
  }, [])

  const gridLines = [0.22, 0.46, 0.7, 0.94]

  return (
    <figure className="glass flex flex-col gap-4 rounded-2xl p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">Growth of &#8377;1,00,000 over ten years</span>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-border/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Sample series
        </span>
      </figcaption>

      <div className="relative aspect-[4/3] w-full">
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="fund-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridLines.map((ratio) => (
            <line
              key={ratio}
              x1={PADDING.left}
              x2={VIEW_WIDTH - PADDING.right}
              y1={VIEW_HEIGHT * ratio}
              y2={VIEW_HEIGHT * ratio}
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}

          <motion.path
            d={chart.benchmarkLine}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeOpacity="0.85"
            strokeWidth="2.25"
            strokeDasharray="6 6"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.path
            d={chart.fundArea}
            fill="url(#fund-area-fill)"
            stroke="none"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.35 }}
          />

          <motion.path
            d={chart.fundLine}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />

          {!reduceMotion && (
            <motion.circle
              cx={chart.marker.x}
              cy={chart.marker.y}
              r="14"
              fill="var(--primary)"
              initial={{ opacity: 0.35, scale: 0.4 }}
              animate={{ opacity: [0.3, 0, 0.3], scale: [0.4, 1.15, 0.4] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }}
              style={{ transformOrigin: `${chart.marker.x}px ${chart.marker.y}px` }}
            />
          )}

          <motion.circle
            cx={chart.marker.x}
            cy={chart.marker.y}
            r="5"
            fill="var(--primary)"
            stroke="var(--background)"
            strokeWidth="2.5"
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 2.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${chart.marker.x}px ${chart.marker.y}px` }}
          />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Selected fund</span>
          </div>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            &#8377;{currency.format(chart.fundValue)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-0.5 w-4 rounded-full bg-muted-foreground/60"
              style={{ backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 3px, transparent 3px 6px)' }}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">Benchmark index</span>
          </div>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-muted-foreground">
            &#8377;{currency.format(chart.benchmarkValue)}
          </p>
        </div>
      </div>
    </figure>
  )
}
