import { useMemo } from 'react'
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, CHART_TOOLTIP_CURSOR } from '@/components/ui/chart'
import { CHART_PANEL_RESPONSIVE_CLASS } from '@/lib/charts/chartSurface'
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
import type { FundReportRisk } from '../../schemas'

type Volatility = FundReportRisk['volatility']

const chartConfig = {
  fundVolatilityPercent: { label: 'Fund', color: CHART_COLORS.fund },
  benchmarkVolatilityPercent: { label: 'Benchmark', color: CHART_COLORS.benchmark },
}

export function RollingVolatilityChart({
  volatility,
  fundName,
  benchmarkName,
}: {
  volatility: Volatility
  fundName: string
  benchmarkName?: string
}) {
  const axis = useResponsiveAxis({ dense: true })
  const chartData = useMemo(
    () =>
      volatility.rollingSeries.map((point) => ({
        ...point,
        label: point.date,
      })),
    [volatility.rollingSeries],
  )

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough history to plot rolling 1-year volatility.
      </p>
    )
  }

  return (
    <div className={CHART_PANEL_RESPONSIVE_CLASS}>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[280px] w-full sm:h-[380px] lg:h-[420px]"
      >
        <LineChart data={chartData} margin={chartPlotMargin({ top: 16, bottom: 8 })}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey="label"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            minTickGap={axis.xGap}
            height={axis.xHeight}
            angle={axis.xAngle}
            textAnchor={axis.xAnchor}
            interval="preserveStartEnd"
            tickFormatter={axis.formatMonthYearTick}
          >
            {axis.showXLabel ? <Label {...xLabel('Date', axis.xAngle === 0 ? 0 : -4)} /> : null}
          </XAxis>
          <YAxis
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            tickFormatter={axis.formatPercentTick}
            width={axis.yWidth}
          >
            {axis.showYLabel ? <Label {...yLabel('Annualised volatility')} /> : null}
          </YAxis>
          <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent format="percent" />} />
          <ReferenceLine
            y={volatility.rollingSummary.averagePercent}
            stroke={CHART_COLORS.violet}
            strokeDasharray="4 4"
            label={{ value: 'Fund average', position: 'insideTopRight', fill: CHART_COLORS.violet, fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="fundVolatilityPercent"
            name={fundName}
            stroke={CHART_COLORS.fund}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {volatility.benchmarkAvailable ? (
            <Line
              type="monotone"
              dataKey="benchmarkVolatilityPercent"
              name={benchmarkName || 'Benchmark'}
              stroke={CHART_COLORS.benchmark}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ) : null}
        </LineChart>
      </ChartContainer>
    </div>
  )
}
