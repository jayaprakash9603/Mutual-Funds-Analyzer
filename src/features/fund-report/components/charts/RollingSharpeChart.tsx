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
  fundSharpe: { label: 'Fund', color: CHART_COLORS.fund },
  benchmarkSharpe: { label: 'Benchmark', color: CHART_COLORS.benchmark },
}

function regimeCaption(series: Volatility['rollingSharpeSeries']): string | null {
  if (series.length < 2) return null
  const latest = series[series.length - 1]!.fundSharpe
  const cutoff = new Date(series[series.length - 1]!.date)
  cutoff.setFullYear(cutoff.getFullYear() - 3)
  const older = [...series]
    .reverse()
    .find((point) => new Date(point.date).getTime() <= cutoff.getTime())
  if (!older) return null
  const delta = latest - older.fundSharpe
  if (Math.abs(delta) < 0.05) {
    return 'Risk-adjusted returns have been roughly stable over the last 3 years.'
  }
  return delta > 0
    ? 'Risk-adjusted returns have been improving over the last 3 years.'
    : 'Risk-adjusted returns have been declining over the last 3 years.'
}

export function RollingSharpeChart({
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
      (volatility.rollingSharpeSeries ?? []).map((point) => ({
        ...point,
        label: point.date,
      })),
    [volatility.rollingSharpeSeries],
  )
  const caption = useMemo(
    () => regimeCaption(volatility.rollingSharpeSeries ?? []),
    [volatility.rollingSharpeSeries],
  )

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough history to plot rolling 1-year Sharpe ratio.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}
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
              width={axis.yWidth}
              tickFormatter={(value) => Number(value).toFixed(1)}
            >
              {axis.showYLabel ? <Label {...yLabel('Rolling Sharpe')} /> : null}
            </YAxis>
            <ChartTooltip
              cursor={CHART_TOOLTIP_CURSOR}
              content={<ChartTooltipContent format="number" />}
            />
            <ReferenceLine y={0} stroke={GRID_STROKE} />
            <Line
              type="monotone"
              dataKey="fundSharpe"
              name={fundName}
              stroke={CHART_COLORS.fund}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {volatility.benchmarkAvailable ? (
              <Line
                type="monotone"
                dataKey="benchmarkSharpe"
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
    </div>
  )
}
