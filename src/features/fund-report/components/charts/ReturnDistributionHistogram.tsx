import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
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
import { formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'

type Volatility = FundReportRisk['volatility']

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: Volatility['dailyDistribution'][number] }>
}) {
  if (!active || !payload?.length) return null
  const bucket = payload[0]?.payload
  if (!bucket) return null

  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{bucket.label}</p>
      <p>{bucket.count} days</p>
      <p>{formatPercent(bucket.sharePercent, 1)} of all days</p>
    </div>
  )
}

export function ReturnDistributionHistogram({
  volatility,
}: {
  volatility: Volatility
}) {
  const axis = useResponsiveAxis({ dense: true })
  const chartData = useMemo(() => volatility.dailyDistribution, [volatility.dailyDistribution])

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No daily return distribution available.</p>
  }

  return (
    <div className={CHART_PANEL_CLASS}>
      <ChartContainer config={{}} className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]">
        <BarChart data={chartData} margin={chartPlotMargin({ top: 12, bottom: 8 })}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey="label"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            interval={0}
            angle={axis.xAngle}
            textAnchor={axis.xAnchor}
            height={axis.xHeight}
          >
            <Label {...xLabel('Daily return bucket', axis.xAngle === 0 ? 0 : -4)} />
          </XAxis>
          <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} width={axis.yWidth}>
            {axis.showYLabel ? <Label {...yLabel('Days')} /> : null}
          </YAxis>
          <Tooltip content={<DistributionTooltip />} />
          <Bar dataKey="count" name="Days" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {chartData.map((bucket) => (
              <Cell
                key={bucket.label}
                fill={bucket.upperPercent <= 0 ? CHART_COLORS.red : bucket.lowerPercent >= 0 ? CHART_COLORS.fund : CHART_COLORS.amber}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
