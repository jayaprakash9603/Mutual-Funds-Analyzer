import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Label, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import {
  AXIS_LINE,
  formatAxisPercentTick,
  GRID_STROKE,
  MARGIN_LEFT,
  TICK_LINE,
  TICK_MD,
  yLabel,
  ZERO_LINE_STROKE,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS, signedReturnColor } from '@/lib/charts/chartColors'
import { formatPercent } from '@/lib/utils'
import type { FundReportPerformance } from '../../schemas'

type Insights = FundReportPerformance['calendarYearInsights']

type SortedCalendarReturnsChartProps = {
  sortedReturns: Insights['sortedReturns']
  fundName: string
}

export function SortedCalendarReturnsChart({
  sortedReturns,
  fundName,
}: SortedCalendarReturnsChartProps) {
  const rows = useMemo(
    () =>
      sortedReturns.years.map((row) => ({
        ...row,
        label: String(row.year),
      })),
    [sortedReturns.years],
  )

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          Calendar year returns are volatile and rarely resemble long-term averages
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {fundName} ({sortedReturns.periodLabel}) — years ranked highest to lowest
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center text-sm font-semibold">
        {formatPercent(sortedReturns.cagrPercent, 1)} CAGR ·{' '}
        {sortedReturns.moneyMultiple.toFixed(0)}× over the full period
      </div>

      {sortedReturns.headline ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{sortedReturns.headline}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-blue-600" aria-hidden="true" />
          Annual return (%)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-emerald-600" aria-hidden="true" />
          Years between {formatPercent(sortedReturns.longTermBandLow, 0)} and{' '}
          {formatPercent(sortedReturns.longTermBandHigh, 0)}
        </span>
      </div>

      <div className="w-full rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <ChartContainer
          config={{ returnPercent: { label: 'Return', color: CHART_COLORS.blue } }}
          className="aspect-auto h-[320px] w-full sm:h-[380px]"
        >
          <BarChart data={rows} margin={{ ...MARGIN_LEFT, top: 12, right: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" hide />
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatAxisPercentTick}
              width={48}
            >
              <Label {...yLabel('Annual return')} />
            </YAxis>
            <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent format="percent" />} />
            <Bar dataKey="returnPercent" radius={[3, 3, 0, 0]}>
              {rows.map((row) => (
                <Cell
                  key={row.year}
                  fill={row.inLongTermBand ? CHART_COLORS.fund : CHART_COLORS.blue}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {rows.map((row) => (
            <span
              key={row.year}
              className="inline-block px-0.5 tabular-nums"
              style={{ color: signedReturnColor(row.returnPercent) }}
            >
              {formatPercent(row.returnPercent, 1)}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
