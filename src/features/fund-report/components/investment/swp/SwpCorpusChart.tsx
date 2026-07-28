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
import type { SwpTimelinePoint } from '../../../schemas'

const chartConfig = {
  corpus: { label: 'Remaining corpus', color: CHART_COLORS.fund },
  withdrawn: { label: 'Total withdrawn', color: CHART_COLORS.benchmark },
} satisfies ChartConfig

function formatLakhs(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}k`
  return `₹${value.toFixed(0)}`
}

function SwpTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: SwpTimelinePoint & { label: string } }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{point.date}</p>
      <p>
        Corpus: <span className="font-mono font-semibold">{formatLakhs(point.corpus)}</span>
      </p>
      <p>
        Withdrawn: <span className="font-mono font-semibold">{formatLakhs(point.withdrawn)}</span>
      </p>
      <p className="text-xs text-muted-foreground">NAV ₹{point.nav.toFixed(2)}</p>
    </div>
  )
}

type SwpCorpusChartProps = {
  timeline: SwpTimelinePoint[]
  initialCorpus: number
  monthlyWithdrawal: number
  scheduleDay: number
}

export function SwpCorpusChart({
  timeline,
  initialCorpus,
  monthlyWithdrawal,
  scheduleDay,
}: SwpCorpusChartProps) {
  const axis = useResponsiveAxis()
  const chartData = useMemo(() => {
    const mapped = timeline.map((point) => ({
      ...point,
      label: point.date.slice(0, 7),
    }))
    return downsample(mapped, 120)
  }, [timeline])

  if (chartData.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No SWP timeline data for this schedule.
      </p>
    )
  }

  return (
    <div className={CHART_PANEL_CLASS}>
      <div className="mb-3 px-1">
        <h4 className="text-sm font-semibold text-foreground">SWP corpus over time</h4>
        <p className="text-xs text-muted-foreground">
          ₹{initialCorpus.toLocaleString('en-IN')} invested, then ₹
          {monthlyWithdrawal.toLocaleString('en-IN')}/month withdrawn on day {scheduleDay}
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
          >
            <Label {...xLabel('Month', -2)} />
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
          <Tooltip content={<SwpTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="corpus"
            name="Remaining corpus"
            stroke={CHART_COLORS.fund}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="withdrawn"
            name="Total withdrawn"
            stroke={CHART_COLORS.benchmark}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
