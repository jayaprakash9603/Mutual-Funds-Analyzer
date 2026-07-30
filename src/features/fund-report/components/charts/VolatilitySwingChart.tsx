import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ReferenceLine,
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
  formatAxisPercentTick,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'

type Volatility = FundReportRisk['volatility']

type SwingRow = {
  frequency: string
  fundBest: number
  fundWorst: number
  benchmarkBest: number
  benchmarkWorst: number
}

function SwingTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: SwingRow }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{row.frequency}</p>
      <p className="text-emerald-600 dark:text-emerald-400">Fund best: {formatPercent(row.fundBest, 1)}</p>
      <p className="text-red-600 dark:text-red-400">Fund worst: {formatPercent(row.fundWorst, 1)}</p>
      {row.benchmarkBest !== 0 || row.benchmarkWorst !== 0 ? (
        <>
          <p className="mt-1 text-orange-500">Benchmark best: {formatPercent(row.benchmarkBest, 1)}</p>
          <p className="text-orange-500">Benchmark worst: {formatPercent(row.benchmarkWorst, 1)}</p>
        </>
      ) : null}
    </div>
  )
}

export function VolatilitySwingChart({
  volatility,
}: {
  volatility: Volatility
}) {
  const axis = useResponsiveAxis()
  const chartData = useMemo<SwingRow[]>(
    () =>
      volatility.periods.map((period) => ({
        frequency: period.frequency,
        fundBest: period.bestReturnPercent,
        fundWorst: period.worstReturnPercent,
        benchmarkBest: period.benchmarkBestReturnPercent,
        benchmarkWorst: period.benchmarkWorstReturnPercent,
      })),
    [volatility.periods],
  )

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No swing data available.</p>
  }

  return (
    <div className={CHART_PANEL_CLASS}>
      <ChartContainer config={{}} className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]">
        <BarChart data={chartData} margin={chartPlotMargin({ top: 12, bottom: 8 })}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis dataKey="frequency" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick}>
            <Label {...xLabel('Time frame')} />
          </XAxis>
          <YAxis
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            tickFormatter={formatAxisPercentTick}
            width={axis.yWidth}
          >
            {axis.showYLabel ? <Label {...yLabel('Single-period move')} /> : null}
          </YAxis>
          <Tooltip content={<SwingTooltip />} />
          <ReferenceLine y={0} stroke={GRID_STROKE} />
          <Bar dataKey="fundBest" name="Fund best" fill={CHART_COLORS.fund} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="fundWorst" name="Fund worst" radius={[0, 0, 4, 4]} isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell key={`${entry.frequency}-worst`} fill={CHART_COLORS.red} />
            ))}
          </Bar>
          {volatility.benchmarkAvailable ? (
            <>
              <Bar
                dataKey="benchmarkBest"
                name="Benchmark best"
                fill={CHART_COLORS.benchmark}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Bar dataKey="benchmarkWorst" name="Benchmark worst" fill="#fdba74" radius={[0, 0, 4, 4]} isAnimationActive={false} />
            </>
          ) : null}
        </BarChart>
      </ChartContainer>
    </div>
  )
}
