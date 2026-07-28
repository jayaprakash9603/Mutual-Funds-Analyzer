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
  MARGIN_X,
  TICK_LINE,
  TICK_MD,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { downsample } from '@/lib/utils'
import type { SipTimelinePoint } from '../../../schemas'

const chartConfig = {
  corpus: { label: 'Corpus value', color: CHART_COLORS.fund },
  invested: { label: 'Total invested', color: CHART_COLORS.benchmark },
} satisfies ChartConfig

function formatLakhs(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}k`
  return `₹${value.toFixed(0)}`
}

function SipTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: SipTimelinePoint & { label: string } }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  const gain = point.corpus - point.invested
  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{point.date}</p>
      <p>
        Invested: <span className="font-mono font-semibold">{formatLakhs(point.invested)}</span>
      </p>
      <p>
        Corpus: <span className="font-mono font-semibold">{formatLakhs(point.corpus)}</span>
      </p>
      <p className={gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
        Gain: <span className="font-mono font-semibold">{formatLakhs(gain)}</span>
      </p>
      <p className="text-xs text-muted-foreground">NAV ₹{point.nav.toFixed(2)}</p>
    </div>
  )
}

type SipCorpusChartProps = {
  timeline: SipTimelinePoint[]
  monthlyAmount: number
  scheduleDay: number
}

export function SipCorpusChart({ timeline, monthlyAmount, scheduleDay }: SipCorpusChartProps) {
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
        No SIP timeline data for this schedule.
      </p>
    )
  }

  return (
    <div className={CHART_PANEL_CLASS}>
      <div className="mb-3 px-1">
        <h4 className="text-sm font-semibold text-foreground">SIP corpus growth</h4>
        <p className="text-xs text-muted-foreground">
          ₹{monthlyAmount.toLocaleString('en-IN')}/month on day {scheduleDay} of each month
        </p>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full sm:h-[360px]">
        <ComposedChart data={chartData} margin={{ ...MARGIN_X, left: 56, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={TICK_MD}
            minTickGap={48}
            height={44}
          >
            <Label {...xLabel('Month', -2)} />
          </XAxis>
          <YAxis
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={TICK_MD}
            tickFormatter={formatLakhs}
            width={52}
          >
            <Label {...yLabel('Value')} />
          </YAxis>
          <Tooltip content={<SipTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="corpus"
            name="Corpus value"
            stroke={CHART_COLORS.fund}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="invested"
            name="Total invested"
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
