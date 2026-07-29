import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
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

type MissingBestQuarter = FundReportRisk['missingBestQuarter']

function QuarterTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: MissingBestQuarter['series'][number] }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{point.quarterLabel}</p>
      <p>Full 3Y CAGR: {formatPercent(point.fullCagrPercent, 1)}</p>
      <p>Ex-best quarter: {formatPercent(point.exBestQuarterCagrPercent, 1)}</p>
      <p className="text-red-600 dark:text-red-400">
        Lost: {formatPercent(point.lostCagrPercent, 1)}
      </p>
      <p className="text-xs text-muted-foreground">Best quarter dropped: {point.bestQuarterLabel}</p>
    </div>
  )
}

export function MissingBestQuarterChart({
  missingBestQuarter,
  fundName,
}: {
  missingBestQuarter: MissingBestQuarter
  fundName: string
}) {
  const axis = useResponsiveAxis()
  const chartData = useMemo(
    () =>
      missingBestQuarter.series.map((point) => ({
        ...point,
        label: point.quarterLabel,
      })),
    [missingBestQuarter.series],
  )

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Need at least three years of quarterly history for missing-best-quarter analysis.
      </p>
    )
  }

  return (
    <div className={CHART_PANEL_CLASS}>
      <div className="mb-3 px-1">
        <h4 className="text-sm font-semibold text-foreground">Missing best quarter</h4>
        <p className="text-xs text-muted-foreground">
          CAGR lost if you missed the best quarter in each rolling 3-year window for {fundName}.
          {missingBestQuarter.headline ? ` ${missingBestQuarter.headline}` : ''}
        </p>
      </div>
      <ChartContainer
        config={{ lostCagrPercent: { label: 'Lost CAGR', color: CHART_COLORS.red } }}
        className="aspect-auto h-[320px] w-full sm:h-[360px]"
      >
        <BarChart data={chartData} margin={chartPlotMargin({ top: 12, bottom: 8 })}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            minTickGap={axis.xGap}
            height={axis.xHeight}
            interval="preserveStartEnd"
          >
            <Label {...xLabel('Quarter', -2)} />
          </XAxis>
          <YAxis
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            tickFormatter={formatAxisPercentTick}
            width={axis.yWidth}
          >
            {axis.showYLabel ? <Label {...yLabel('Lost CAGR (%)')} /> : null}
          </YAxis>
          <ReferenceLine
            y={missingBestQuarter.averageLostPercent}
            stroke={CHART_COLORS.benchmark}
            strokeDasharray="6 4"
            label={{
              value: `Average: ${formatPercent(missingBestQuarter.averageLostPercent, 1)}`,
              position: 'insideTopRight',
              fill: 'var(--muted-foreground)',
              fontSize: 11,
            }}
          />
          <Tooltip content={<QuarterTooltip />} />
          <Bar
            dataKey="lostCagrPercent"
            fill={CHART_COLORS.red}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
