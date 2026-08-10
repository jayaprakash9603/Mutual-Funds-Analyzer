import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  GitCommit,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export type AnnualReturnRow = {
  year: string
  fund: number
  benchmark: number
}

type AnnualReturnsSnakeTimelineProps = {
  data: AnnualReturnRow[]
  fundName: string
  benchmarkName: string
  viewMode: 'snake' | 'bar'
  onViewModeChange: (mode: 'snake' | 'bar') => void
}

type Point = { x: number; y: number }

export function AnnualReturnsSnakeTimeline({
  data,
  fundName,
  benchmarkName,
  viewMode,
  onViewModeChange,
}: AnnualReturnsSnakeTimelineProps) {
  const [selectedSeries, setSelectedSeries] = useState<'fund' | 'benchmark'>('fund')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isGraphFocused, setIsGraphFocused] = useState(false)
  const [cols, setCols] = useState<number>(5)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const pathRefs = useRef<Map<number, SVGPathElement>>(new Map())
  const [pathPoints, setPathPoints] = useState<Point[]>([])

  // Responsive column count calculation
  const updateCols = useCallback(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    if (width >= 1024) setCols(5)
    else if (width >= 768) setCols(4)
    else if (width >= 560) setCols(3)
    else if (width >= 360) setCols(2)
    else setCols(1)
  }, [])

  // Calculate center coordinates of all card nodes relative to container
  const updatePaths = useCallback(() => {
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const points: Point[] = []

    for (let i = 0; i < data.length; i++) {
      const el = cardRefs.current.get(i)
      if (el) {
        const rect = el.getBoundingClientRect()
        points.push({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        })
      }
    }
    setPathPoints(points)
  }, [data.length])

  // ResizeObserver to handle screen & container size changes
  useEffect(() => {
    updateCols()
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      updateCols()
      updatePaths()
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [updateCols, updatePaths])

  // Measure path positions on initial layout and whenever state changes
  useLayoutEffect(() => {
    updatePaths()
    const t1 = setTimeout(updatePaths, 50)
    const t2 = setTimeout(updatePaths, 200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [updatePaths, cols, selectedSeries, data])

  // Animate year-to-year only while the user is over the graph (no page scroll hijacking)
  useEffect(() => {
    if (!isGraphFocused || !data.length) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev === null || prev >= data.length - 1) return 0
        return prev + 1
      })
    }, 1600)

    return () => clearInterval(interval)
  }, [isGraphFocused, data.length])

  const handleGraphEnter = () => {
    setIsGraphFocused(true)
    setActiveIndex((prev) => (prev === null ? 0 : prev))
  }

  const handleGraphLeave = () => {
    setIsGraphFocused(false)
    setActiveIndex(null)
    setHoveredIndex(null)
  }

  const handleNextStep = () => {
    setActiveIndex((prev) => {
      if (prev === null || prev >= data.length - 1) return 0
      return prev + 1
    })
  }

  const handlePrevStep = () => {
    setActiveIndex((prev) => {
      if (prev === null || prev <= 0) return data.length - 1
      return prev - 1
    })
  }

  const handleResetTimeline = () => {
    setActiveIndex(0)
  }

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!data.length) return null
    const returns = data.map((d) => (selectedSeries === 'fund' ? d.fund : d.benchmark))
    const profitCount = returns.filter((r) => r >= 0).length
    const lossCount = returns.filter((r) => r < 0).length
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length

    return {
      total: data.length,
      profitCount,
      lossCount,
      profitPercent: Math.round((profitCount / data.length) * 100),
      avg,
    }
  }, [data, selectedSeries])

  // Reorder items in serpentine format (reversing alternating rows)
  const serpentineGrid = useMemo(() => {
    const gridRows: { item: AnnualReturnRow; originalIndex: number }[][] = []
    let currentRow: { item: AnnualReturnRow; originalIndex: number }[] = []

    data.forEach((item, index) => {
      currentRow.push({ item, originalIndex: index })
      if (currentRow.length === cols || index === data.length - 1) {
        gridRows.push(currentRow)
        currentRow = []
      }
    })

    // Reverse every odd row to form serpentine snake flow
    return gridRows.map((row, rowIndex) => {
      if (rowIndex % 2 === 1) {
        return [...row].reverse()
      }
      return row
    })
  }, [data, cols])

  // Generate SVG path string connecting consecutive nodes
  const svgPaths = useMemo(() => {
    if (pathPoints.length < 2) return []
    const paths: { d: string; isProfit: boolean; key: string; index: number; p1: Point; p2: Point }[] = []

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i]
      const p2 = pathPoints[i + 1]
      if (!p1 || !p2) continue

      const val1 = selectedSeries === 'fund' ? data[i].fund : data[i].benchmark
      const val2 = selectedSeries === 'fund' ? data[i + 1].fund : data[i + 1].benchmark
      const isProfit = (val1 + val2) / 2 >= 0

      const r1 = Math.floor(i / cols)
      const r2 = Math.floor((i + 1) / cols)

      if (r1 === r2) {
        // Same row: horizontal connecting line
        paths.push({
          d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
          isProfit,
          key: `path-${i}`,
          index: i,
          p1,
          p2,
        })
      } else {
        // Different rows: U-turn loop
        if (cols === 1) {
          // Single column mobile layout: vertical S-curve
          const isEven = r1 % 2 === 0
          const offset = isEven ? 55 : -55
          const controlX = p1.x + offset
          paths.push({
            d: `M ${p1.x} ${p1.y} C ${controlX} ${p1.y}, ${controlX} ${p2.y}, ${p2.x} ${p2.y}`,
            isProfit,
            key: `path-${i}`,
            index: i,
            p1,
            p2,
          })
        } else {
          // Multi-column grid layout: U-turn at edge
          const isEvenRow = r1 % 2 === 0
          const curveOffset = isEvenRow ? 65 : -65
          const edgeX = isEvenRow ? Math.max(p1.x, p2.x) : Math.min(p1.x, p2.x)
          const controlX = edgeX + curveOffset

          paths.push({
            d: `M ${p1.x} ${p1.y} C ${controlX} ${p1.y}, ${controlX} ${p2.y}, ${p2.x} ${p2.y}`,
            isProfit,
            key: `path-${i}`,
            index: i,
            p1,
            p2,
          })
        }
      }
    }
    return paths
  }, [pathPoints, data, selectedSeries, cols])

  const activeSeriesName = selectedSeries === 'fund' ? fundName : benchmarkName

  return (
    <div className="space-y-5">
      {/* Dynamic Keyframes for Path Dash Animation */}
      <style>{`
        @keyframes dashFlow {
          from {
            stroke-dashoffset: 32;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-dash-flow {
          animation: dashFlow 1.5s linear infinite;
        }
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.35);
            opacity: 1;
          }
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Top Header Controls & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
        {/* Left: Legend Indicators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shadow-xs" />
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Profit</span>
            <span className="text-muted-foreground text-[11px]">(≥ 0%)</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-foreground bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-full">
            <span className="size-2.5 rounded-full bg-rose-600 dark:bg-rose-500 shadow-xs" />
            <span className="text-rose-700 dark:text-rose-300 font-semibold">Loss</span>
            <span className="text-muted-foreground text-[11px]">(&lt; 0%)</span>
          </div>
        </div>

        {/* Center: Stepping & Reset Controller (Play/Pause removed) */}
        <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border/70 text-xs self-start lg:self-auto shadow-xs">
          <button
            type="button"
            onClick={handlePrevStep}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            title="Previous Year"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="px-2 font-mono font-bold text-foreground text-[11px]">
            {activeIndex !== null ? (data[activeIndex]?.year ?? 'Timeline') : 'Hover graph'}
          </span>

          <button
            type="button"
            onClick={handleNextStep}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            title="Next Year"
          >
            <ChevronRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleResetTimeline}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors ml-0.5"
            title="Restart Timeline Flow"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        {/* Right: Series Selector & View Mode Switcher */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Fund / Benchmark Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/50 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSeries('fund')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedSeries === 'fund'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fund
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeries('benchmark')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedSeries === 'benchmark'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Benchmark
            </button>
          </div>

          {/* Snake Path vs Bar Chart Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/50 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange('snake')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'snake'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Serpentine Timeline Path View"
            >
              <GitCommit className="size-3.5 text-primary" />
              <span>Timeline Path</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('bar')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'bar'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Bar Chart View"
            >
              <BarChart2 className="size-3.5 text-primary" />
              <span>Bar Chart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Serpentine Snake Grid Container — animation runs only while pointer is over it */}
      <div
        ref={containerRef}
        onMouseEnter={handleGraphEnter}
        onMouseLeave={handleGraphLeave}
        className="relative min-h-[300px] py-6 px-6 sm:px-10 md:px-14 bg-muted/10 dark:bg-muted/5 rounded-2xl border border-border/40 overflow-visible"
      >
        {/* SVG Connecting Path Overlay */}
        <svg className="absolute inset-0 size-full pointer-events-none z-0 overflow-visible" aria-hidden="true">
          {svgPaths.map((p) => {
            const isStepActive =
              activeIndex !== null && (activeIndex === p.index || activeIndex === p.index + 1)
            const isSegmentHighlighted = activeIndex !== null && activeIndex > p.index
            const idleAllVisible = activeIndex === null

            return (
              <g key={p.key}>
                {/* Background Guide Track */}
                <path
                  d={p.d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isStepActive ? 8 : 6}
                  strokeLinecap="round"
                  className={`transition-all duration-300 ${
                    isStepActive
                      ? 'text-primary/25'
                      : 'text-muted-foreground/15 dark:text-muted-foreground/25'
                  }`}
                />

                {/* Animated Moving Dashed Flow Return Line */}
                <path
                  ref={(el) => {
                    if (el) pathRefs.current.set(p.index, el)
                    else pathRefs.current.delete(p.index)
                  }}
                  d={p.d}
                  fill="none"
                  stroke={
                    isStepActive
                      ? p.isProfit
                        ? '#059669'
                        : '#e11d48'
                      : p.isProfit
                        ? '#10b981'
                        : '#f43f5e'
                  }
                  strokeWidth={isStepActive ? 4.5 : 3.5}
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                  className={`transition-all duration-300 ${
                    isGraphFocused ? 'animate-dash-flow' : ''
                  } ${
                    idleAllVisible || isSegmentHighlighted || isStepActive
                      ? 'opacity-90 dark:opacity-95'
                      : 'opacity-40'
                  }`}
                />

                {/* Traveling Glow Orb along active line segment */}
                {isStepActive ? (
                  <circle
                    r={6}
                    fill={p.isProfit ? '#10b981' : '#f43f5e'}
                    className="animate-pulse-glow shadow-lg"
                  >
                    <animateMotion
                      path={p.d}
                      dur="1.5s"
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </circle>
                ) : null}
              </g>
            )
          })}
        </svg>

        {/* Serpentine Grid Nodes — overflow-visible so popovers are not clipped */}
        <div className="relative z-10 flex flex-col gap-10 sm:gap-12 overflow-visible">
          {serpentineGrid.map((row, rowIndex) => {
            const rowHasFocus = row.some(
              ({ originalIndex }) => originalIndex === activeIndex || originalIndex === hoveredIndex,
            )

            return (
              <div
                key={`row-${rowIndex}`}
                className={`relative grid gap-x-4 sm:gap-x-8 gap-y-6 items-center justify-items-center overflow-visible ${
                  rowHasFocus ? 'z-50' : 'z-0'
                }`}
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {row.map(({ item, originalIndex }) => {
                  const val = selectedSeries === 'fund' ? item.fund : item.benchmark
                  const otherVal = selectedSeries === 'fund' ? item.benchmark : item.fund
                  const lead = item.fund - item.benchmark
                  const isProfit = val >= 0
                  const isHovered = hoveredIndex === originalIndex
                  const isActive = activeIndex === originalIndex
                  // Popover only on manual hover — not during automatic highlight flow
                  const showPopover = isHovered
                  // Top row: place popover below to avoid clipping; else above the card
                  const popoverBelow = rowIndex === 0

                  return (
                    <div
                      key={`node-${item.year}`}
                      ref={(el) => {
                        if (el) cardRefs.current.set(originalIndex, el)
                        else cardRefs.current.delete(originalIndex)
                      }}
                      onMouseEnter={() => setHoveredIndex(originalIndex)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setActiveIndex(originalIndex)}
                      className={`relative group transition-all duration-300 transform overflow-visible ${
                        isHovered || isActive ? 'z-[60]' : 'z-10'
                      }`}
                    >
                      {/* Year Tag Tab resting on top border */}
                      <div
                        className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase border shadow-xs z-20 transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-md ring-2 ring-primary/40'
                            : isProfit
                              ? 'bg-background text-emerald-700 border-emerald-500/50 dark:bg-background dark:text-emerald-400 dark:border-emerald-500/60'
                              : 'bg-background text-rose-700 border-rose-500/50 dark:bg-background dark:text-rose-400 dark:border-rose-500/60'
                        }`}
                      >
                        {item.year}
                      </div>

                      {/* Main Year Card Box */}
                      <div
                        className={`w-28 sm:w-32 md:w-36 pt-4 pb-2.5 px-2.5 rounded-xl border shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
                          isActive
                            ? 'scale-112 -translate-y-2 shadow-2xl ring-4 ring-primary/50 dark:ring-primary/60'
                            : isHovered
                              ? 'scale-108 -translate-y-1 shadow-xl ring-2 ring-primary/40'
                              : ''
                        } ${
                          isProfit
                            ? 'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20'
                            : 'bg-rose-600 dark:bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
                        }`}
                      >
                        {/* Return Percentage */}
                        <span className="text-base sm:text-lg font-black tracking-tight tabular-nums drop-shadow-xs flex items-center justify-center gap-1">
                          {val >= 0 ? '+' : ''}
                          {val.toFixed(1)}%
                          {isActive ? <Sparkles className="size-3.5 text-amber-200 animate-spin" /> : null}
                        </span>

                        {/* Sub-label comparison */}
                        <span className="mt-1 text-[10px] sm:text-[11px] font-medium opacity-90 truncate max-w-full px-1.5 py-0.5 rounded bg-black/20">
                          {selectedSeries === 'fund'
                            ? `Bench: ${otherVal >= 0 ? '+' : ''}${otherVal.toFixed(1)}%`
                            : `Fund: ${otherVal >= 0 ? '+' : ''}${otherVal.toFixed(1)}%`}
                        </span>
                      </div>

                      {/* Rich Tooltip — elevated above sibling year cards */}
                      {showPopover ? (
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-lg border border-border bg-popover text-popover-foreground text-xs shadow-xl pointer-events-none animate-in fade-in-50 zoom-in-95 ${
                            popoverBelow ? 'top-full mt-3' : 'bottom-full mb-2'
                          }`}
                          style={{ zIndex: 100 }}
                        >
                          <p className="font-bold text-foreground border-b border-border/60 pb-1 mb-1.5 flex items-center justify-between">
                            <span>{item.year} Calendar Return</span>
                            <span
                              className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                                isProfit
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isProfit ? 'Profit' : 'Loss'}
                            </span>
                          </p>

                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground truncate">{fundName}:</span>
                              <span className="font-mono font-bold tabular-nums text-foreground">
                                {item.fund >= 0 ? '+' : ''}
                                {item.fund.toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground truncate">{benchmarkName}:</span>
                              <span className="font-mono font-bold tabular-nums text-foreground">
                                {item.benchmark >= 0 ? '+' : ''}
                                {item.benchmark.toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-border/50 pt-1 mt-1">
                              <span className="text-muted-foreground">Fund Lead:</span>
                              <span
                                className={`font-mono font-bold tabular-nums ${
                                  lead >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {lead >= 0 ? '+' : ''}
                                {lead.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Stats Banner */}
      {summary ? (
        <div className="mt-4 pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/20 px-4 py-2.5 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{activeSeriesName}:</span>
            <span>
              <strong className="text-foreground font-semibold">{summary.total}</strong> Years Analyzed
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="size-3.5" />
              <span>
                <strong>{summary.profitCount}</strong> Profit Years ({summary.profitPercent}%)
              </span>
            </span>

            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <TrendingDown className="size-3.5" />
              <span>
                <strong>{summary.lossCount}</strong> Loss Years
              </span>
            </span>

            <span className="text-foreground font-medium">
              Avg Return:{' '}
              <span
                className={`font-semibold font-mono ${
                  summary.avg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {summary.avg >= 0 ? '+' : ''}
                {summary.avg.toFixed(1)}%
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
