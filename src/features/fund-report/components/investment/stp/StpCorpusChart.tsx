import { useMemo } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { MAX_CHART_POINTS } from '@/lib/constants'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { downsample } from '@/lib/utils'
import type { StpTimelinePoint } from '../../../schemas'

const chartConfig = {
  sourceCorpus: { label: 'Source fund (parked)', color: CHART_COLORS.benchmark },
  targetCorpus: { label: 'Target fund (deployed)', color: CHART_COLORS.fund },
  totalValue: { label: 'Total portfolio', color: CHART_COLORS.blue },
  transferred: { label: 'Transferred to target', color: CHART_COLORS.violet },
  averageTotal: { label: 'Monthly avg portfolio', color: CHART_COLORS.amber },
} satisfies ChartConfig

function formatLakhs(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}k`
  return `₹${value.toFixed(0)}`
}

function StpTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: StpTimelinePoint & { label: string } }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  const gain = point.totalValue - point.transferred
  return (
    <div className="min-w-[240px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{point.date}</p>
      <p>
        Source (parked):{' '}
        <span className="font-mono font-semibold">{formatLakhs(point.sourceCorpus)}</span>
      </p>
      <p>
        Target (deployed):{' '}
        <span className="font-mono font-semibold">{formatLakhs(point.targetCorpus)}</span>
      </p>
      <p>
        Total portfolio:{' '}
        <span className="font-mono font-semibold">{formatLakhs(point.totalValue)}</span>
      </p>
      <p>
        Transferred:{' '}
        <span className="font-mono font-semibold">{formatLakhs(point.transferred)}</span>
      </p>
      <p className={gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
        Unrealised gain: <span className="font-mono font-semibold">{formatLakhs(gain)}</span>
      </p>
      <p className="text-xs text-muted-foreground">Target NAV ₹{point.targetNav.toFixed(2)}</p>
    </div>
  )
}

type StpCorpusChartProps = {
  timeline: StpTimelinePoint[]
  sourceScheme: string
  targetScheme: string
  lumpSum: number
  monthlyTransfer: number
  transferMonths: number
  scheduleDay: number
}

export function StpCorpusChart({
  timeline,
  sourceScheme,
  targetScheme,
  lumpSum,
  monthlyTransfer,
  transferMonths,
  scheduleDay,
}: StpCorpusChartProps) {
  const axis = useResponsiveAxis()
  const chartData = useMemo(() => {
    const mapped = timeline.map((point) => ({
      ...point,
      label: point.date,
    }))
    return downsample(mapped, MAX_CHART_POINTS)
  }, [timeline])

  if (chartData.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No STP timeline data for this schedule. Pick a source fund to simulate transfers.
      </p>
    )
  }

  const shortSource = sourceScheme.length > 42 ? `${sourceScheme.slice(0, 39)}…` : sourceScheme
  const shortTarget = targetScheme.length > 42 ? `${targetScheme.slice(0, 39)}…` : targetScheme

  return (
    <div className={CHART_PANEL_CLASS}>
      <div className="mb-3 px-1">
        <h4 className="text-sm font-semibold text-foreground">STP dual-fund growth</h4>
        <p className="text-xs text-muted-foreground">
          ₹{lumpSum.toLocaleString('en-IN')} parked in source, then ₹
          {monthlyTransfer.toLocaleString('en-IN')}/month transferred over {transferMonths} months
          on day {scheduleDay}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Source: {shortSource} → Target: {shortTarget}
        </p>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full sm:h-[360px]">
        <ComposedChart data={chartData} margin={chartPlotMargin({ top: 8, right: 12, bottom: 8 })}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            minTickGap={axis.xGap}
            height={axis.xHeight}
            tickFormatter={(value: string) => {
              if (typeof value !== 'string' || value.length < 7) return value
              const year = value.slice(0, 4)
              const month = value.slice(5, 7)
              return month === '01' ? year : `${year.slice(2)}-${month}`
            }}
          >
            <Label {...xLabel('Date', -2)} />
          </XAxis>
          <YAxis
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            tickFormatter={formatLakhs}
            width={axis.yWidth}
          >
            {axis.showYLabel ? <Label {...yLabel('Value')} /> : null}
          </YAxis>
          <Tooltip content={<StpTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="sourceCorpus"
            name="Source fund (parked)"
            stroke={CHART_COLORS.benchmark}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="targetCorpus"
            name="Target fund (deployed)"
            stroke={CHART_COLORS.fund}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="totalValue"
            name="Total portfolio"
            stroke={CHART_COLORS.blue}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="transferred"
            name="Transferred to target"
            stroke={CHART_COLORS.violet}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="averageTotal"
            name="Monthly avg portfolio"
            stroke={CHART_COLORS.amber}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
