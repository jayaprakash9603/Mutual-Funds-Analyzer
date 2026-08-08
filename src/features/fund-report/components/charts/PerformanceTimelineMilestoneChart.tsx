import { useMemo } from 'react'
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceDot,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_TOOLTIP_CURSOR,
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { CHART_INSET_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  TICK_LINE,
  xLabel,
  yLabelRight,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { downsample } from '@/lib/utils'
import type {
  MilestoneKind,
  PerformanceTimelineChartPoint,
} from '@/lib/analytics/performanceTimelineAnalysis'

const FUND_COLOR = CHART_COLORS.fund
const BENCHMARK_COLOR = CHART_COLORS.benchmark
const MILESTONE_COLORS: Record<MilestoneKind, string> = {
  inception: '#3b82f6',
  best: '#10b981',
  worst: '#ef4444',
  mid: '#f59e0b',
  latest: '#8b5cf6',
}

const chartConfig = {
  fund: { label: 'Fund', color: FUND_COLOR },
  benchmark: { label: 'Benchmark', color: BENCHMARK_COLOR },
} satisfies ChartConfig

const CHART_HEIGHT_CLASS = 'aspect-auto h-[280px] w-full sm:h-[340px] lg:h-[380px]'
const Y_DOMAIN: ['auto', 'auto'] = ['auto', 'auto']

function MilestoneChartTooltip({
  active,
  payload,
  fundName,
  benchmarkName,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: PerformanceTimelineChartPoint }>
  fundName: string
  benchmarkName: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const alpha = point.fund - point.benchmark

  return (
    <div className="min-w-[240px] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{point.tooltipRange}</p>
      <p>
        <span className="text-muted-foreground">{fundName}:</span>{' '}
        <span className="font-mono font-semibold tabular-nums">{point.fund.toFixed(2)}%</span>
      </p>
      <p>
        <span className="text-muted-foreground">{benchmarkName}:</span>{' '}
        <span className="font-mono font-semibold tabular-nums">{point.benchmark.toFixed(2)}%</span>
      </p>
      <p className="mt-1 border-t border-border/70 pt-1">
        <span className="text-muted-foreground">Alpha:</span>{' '}
        <span
          className={`font-mono font-semibold tabular-nums ${alpha >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {alpha >= 0 ? '+' : ''}
          {alpha.toFixed(2)}%
        </span>
      </p>
      {point.milestone ? (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          Milestone: {point.milestone.replace('-', ' ')}
        </p>
      ) : null}
    </div>
  )
}

export function PerformanceTimelineMilestoneChart({
  points,
  fundName,
  benchmarkName,
}: {
  points: PerformanceTimelineChartPoint[]
  fundName: string
  benchmarkName: string
}) {
  const axis = useResponsiveAxis()
  const chartData = useMemo(() => downsample(points, 120), [points])

  const milestoneDots = useMemo(
    () => points.filter((point) => point.milestone),
    [points],
  )

  return (
    <div className={CHART_INSET_CLASS}>
      <ChartContainer config={chartConfig} className={CHART_HEIGHT_CLASS}>
        <LineChart
          data={chartData}
          margin={{ top: 16, right: axis.isSmall ? 40 : 56, left: 4, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="shortLabel"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            minTickGap={axis.xGap}
            tick={axis.tick}
            angle={axis.xAngle}
            textAnchor={axis.xAnchor}
            height={axis.xHeight}
            tickFormatter={axis.formatMonthYearTick}
          >
            {axis.showXLabel ? (
              <Label {...xLabel('Window end date', axis.xAngle === 0 ? -2 : -4)} />
            ) : null}
          </XAxis>
          <YAxis
            orientation="right"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            tickFormatter={axis.formatPercentTick}
            domain={Y_DOMAIN}
            width={axis.yWidth}
          >
            {axis.showYLabel ? <Label {...yLabelRight('Rolling return (%)')} /> : null}
          </YAxis>
          <ChartTooltip
            cursor={CHART_TOOLTIP_CURSOR}
            content={<MilestoneChartTooltip fundName={fundName} benchmarkName={benchmarkName} />}
          />
          <Line
            type="monotone"
            dataKey="fund"
            name="fund"
            stroke={FUND_COLOR}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="benchmark"
            stroke={BENCHMARK_COLOR}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
          {milestoneDots.map((point) =>
            point.milestone ? (
              <ReferenceDot
                key={`${point.milestone}-${point.shortLabel}`}
                x={point.shortLabel}
                y={point.fund}
                r={5}
                fill={MILESTONE_COLORS[point.milestone]}
                stroke="var(--background)"
                strokeWidth={2}
                ifOverflow="visible"
              />
            ) : null,
          )}
        </LineChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-[10px] sm:text-xs">
        {Object.entries(MILESTONE_COLORS).map(([kind, color]) => (
          <span key={kind} className="inline-flex items-center gap-1.5 capitalize text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            {kind.replace('-', ' ')}
          </span>
        ))}
      </div>
    </div>
  )
}
