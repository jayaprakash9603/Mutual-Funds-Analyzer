import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Layers, BarChart2, GitCommit } from 'lucide-react'
import { CHART_COLORS } from '@/lib/charts/chartColors'

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
  const [cols, setCols] = useState<number>(5)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [pathPoints, setPathPoints] = useState<Point[]>([])

  // Measure responsive column count
  const updateCols = useCallback(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    if (width >= 1024) setCols(5)
    else if (width >= 720) setCols(4)
    else if (width >= 480) setCols(3)
    else setCols(2)
  }, [])

  useEffect(() => {
    updateCols()
    const ro = new ResizeObserver(updateCols)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [updateCols])

  // Compute centers of all card nodes relative to container
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

  useEffect(() => {
    updatePaths()
    const timer = setTimeout(updatePaths, 50)
    window.addEventListener('resize', updatePaths)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePaths)
    }
  }, [updatePaths, cols, selectedSeries])

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!data.length) return null
    const returns = data.map((d) => (selectedSeries === 'fund' ? d.fund : d.benchmark))
    const profitCount = returns.filter((r) => r >= 0).length
    const lossCount = returns.filter((r) => r < 0).length
    const best = data.reduce((max, d) => {
      const val = selectedSeries === 'fund' ? d.fund : d.benchmark
      return val > (selectedSeries === 'fund' ? max.fund : max.benchmark) ? d : max
    }, data[0])
    const worst = data.reduce((min, d) => {
      const val = selectedSeries === 'fund' ? d.fund : d.benchmark
      return val < (selectedSeries === 'fund' ? min.fund : min.benchmark) ? d : min
    }, data[0])

    const avg = returns.reduce((a, b) => a + b, 0) / returns.length

    return {
      total: data.length,
      profitCount,
      lossCount,
      profitPercent: Math.round((profitCount / data.length) * 100),
      best,
      worst,
      avg,
    }
  }, [data, selectedSeries])

  // Reorder items in serpentine format
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

    // Reverse every odd row to create the winding serpentine layout
    return gridRows.map((row, rowIndex) => {
      if (rowIndex % 2 === 1) {
        return [...row].reverse()
      }
      return row
    })
  }, [data, cols])

  // Generate SVG path string connecting nodes
  const svgPaths = useMemo(() => {
    if (pathPoints.length < 2) return []
    const paths: { d: string; isProfit: boolean }[] = []

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i]
      const p2 = pathPoints[i + 1]
      const val1 = selectedSeries === 'fund' ? data[i].fund : data[i].benchmark
      const val2 = selectedSeries === 'fund' ? data[i + 1].fund : data[i + 1].benchmark
      const isProfit = (val1 + val2) / 2 >= 0

      // Check if p1 and p2 are on different vertical rows
      const dy = Math.abs(p2.y - p1.y)

      if (dy < 25) {
        // Straight horizontal or near horizontal line
        paths.push({
          d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
          isProfit,
        })
      } else {
        // U-turn curve connecting end of one row to start of next row
        const midY = (p1.y + p2.y) / 2
        const isRightEdge = p1.x > p2.x
        const curveOffset = isRightEdge ? 45 : -45

        const controlX = Math.max(p1.x, p2.x) + (isRightEdge ? curveOffset : -Math.abs(curveOffset))

        paths.push({
          d: `M ${p1.x} ${p1.y} C ${controlX} ${p1.y}, ${controlX} ${p2.y}, ${p2.x} ${p2.y}`,
          isProfit,
        })
      }
    }
    return paths
  }, [pathPoints, data, selectedSeries])

  const activeSeriesName = selectedSeries === 'fund' ? fundName : benchmarkName

  return (
    <div className="space-y-5">
      {/* Top Header Controls & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        {/* Left: Legend Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shadow-xs" />
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Profit</span>
            <span className="text-muted-foreground text-[11px]">(≥ 0%)</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-foreground bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-full">
            <span className="size-2.5 rounded-full bg-rose-600 dark:bg-rose-500 shadow-xs" />
            <span className="text-rose-700 dark:text-rose-300 font-semibold">Loss</span>
            <span className="text-muted-foreground text-[11px] shadow-xs">(&lt; 0%)</span>
          </div>
        </div>

        {/* Right: Series Toggle & View Mode Toggle */}
        <div className="flex items-center gap-2">
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
              title="Serpentine Winding Timeline Path View"
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

      {/* Main Serpentine Snake Container */}
      <div ref={containerRef} className="relative min-h-[300px] py-4 px-2 sm:px-6">
        {/* SVG Connecting Path Overlay */}
        <svg className="absolute inset-0 size-full pointer-events-none z-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="profitPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="lossPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {svgPaths.map((p, idx) => (
            <path
              key={`path-${idx}`}
              d={p.d}
              fill="none"
              stroke={p.isProfit ? 'url(#profitPathGrad)' : 'url(#lossPathGrad)'}
              strokeWidth={3}
              strokeDasharray="6 4"
              strokeLinecap="round"
              className="transition-all duration-300 opacity-70 dark:opacity-80"
            />
          ))}
        </svg>

        {/* Serpentine Grid Nodes */}
        <div className="relative z-10 flex flex-col gap-10 sm:gap-12">
          {serpentineGrid.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-x-4 sm:gap-x-8 gap-y-6 items-center justify-items-center"
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

                return (
                  <div
                    key={`node-${item.year}`}
                    ref={(el) => {
                      if (el) cardRefs.current.set(originalIndex, el)
                      else cardRefs.current.delete(originalIndex)
                    }}
                    onMouseEnter={() => setHoveredIndex(originalIndex)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="relative group transition-all duration-300 transform"
                  >
                    {/* Floating Year Tag resting on top border */}
                    <div
                      className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-t-md rounded-b-sm text-[11px] font-bold tracking-wider uppercase border shadow-xs z-20 transition-colors ${
                        isProfit
                          ? 'bg-emerald-950 text-emerald-100 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-rose-950 text-rose-100 border-rose-600 dark:bg-rose-950 dark:text-rose-200'
                      }`}
                    >
                      {item.year}
                    </div>

                    {/* Main Year Card Box */}
                    <div
                      className={`w-28 sm:w-32 md:w-36 pt-4 pb-2.5 px-2.5 rounded-xl border shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer ${
                        isHovered ? 'scale-108 -translate-y-1 shadow-xl ring-2 ring-primary/40 z-30' : 'z-10'
                      } ${
                        isProfit
                          ? 'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20'
                          : 'bg-rose-600 dark:bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
                      }`}
                    >
                      {/* Main Percentage Return */}
                      <span className="text-base sm:text-lg font-black tracking-tight tabular-nums drop-shadow-xs">
                        {val >= 0 ? '+' : ''}
                        {val.toFixed(1)}%
                      </span>

                      {/* Secondary Comparison Text */}
                      <span className="mt-1 text-[10px] sm:text-[11px] font-medium opacity-90 truncate max-w-full px-1 py-0.5 rounded bg-black/15">
                        {selectedSeries === 'fund'
                          ? `Bench: ${otherVal >= 0 ? '+' : ''}${otherVal.toFixed(1)}%`
                          : `Fund: ${otherVal >= 0 ? '+' : ''}${otherVal.toFixed(1)}%`}
                      </span>
                    </div>

                    {/* Rich Tooltip on Hover */}
                    {isHovered ? (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg border border-border bg-popover text-popover-foreground text-xs shadow-xl z-50 pointer-events-none animate-in fade-in-50 zoom-in-95">
                        <p className="font-bold text-foreground border-b border-border/60 pb-1 mb-1.5 flex items-center justify-between">
                          <span>{item.year} Calendar Return</span>
                          <span
                            className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                              isProfit ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
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
                                lead >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
          ))}
        </div>
      </div>

      {/* Summary Stats Banner at Bottom */}
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
              <span className={`font-semibold font-mono ${summary.avg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
