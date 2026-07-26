import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Label, LabelList, ReferenceLine, XAxis, YAxis } from 'recharts'
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
  xLabel,
  yLabel,
  ZERO_LINE_STROKE,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { formatPercent } from '@/lib/utils'
import type { FundReportPerformance } from '../../schemas'

type Insights = FundReportPerformance['calendarYearInsights']

function bucketColor(minInclusive: number) {
  return minInclusive < 0 ? CHART_COLORS.red : CHART_COLORS.fund
}

type AnnualReturnDistributionChartProps = {
  distribution: Insights['distribution']
  fundName: string
}

export function AnnualReturnDistributionChart({
  distribution,
  fundName,
}: AnnualReturnDistributionChartProps) {
  const rows = useMemo(
    () =>
      distribution.buckets.map((bucket) => ({
        ...bucket,
        shortLabel: bucket.label.replace(' or better', '+').replace(' or worse', '−'),
        labelText: `${formatPercent(bucket.percentOfYears, 0)} (${bucket.yearCount}Y)`,
      })),
    [distribution.buckets],
  )

  const negativeCount = rows.filter((row) => row.minInclusive < 0).length
  const positiveCount = rows.length - negativeCount

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          Calendar-year returns are positive in most years — but spread widely
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Distribution of {fundName} annual returns across {distribution.totalYears} calendar years
        </p>
      </div>

      {distribution.headline ? (
        <p className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm leading-relaxed text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
          {distribution.headline}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-red-200/70 bg-red-50/70 px-3 py-2 text-center text-xs font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          {formatPercent(distribution.negativeYearsPercent, 0)} of years ({distribution.negativeYearCount}Y) with negative returns
        </div>
        <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-center text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          {formatPercent(distribution.positiveYearsPercent, 0)} of years ({distribution.positiveYearCount}Y) with positive returns
        </div>
      </div>

      <div className="relative w-full rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <ChartContainer
          config={{ percentOfYears: { label: '% of years', color: CHART_COLORS.fund } }}
          className="aspect-auto h-[300px] w-full sm:h-[340px]"
        >
          <BarChart data={rows} margin={{ ...MARGIN_LEFT, top: 36, right: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="shortLabel"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={72}
            >
              <Label {...xLabel('Annual return bucket', -4)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatAxisPercentTick}
              width={44}
            >
              <Label {...yLabel('% of years')} />
            </YAxis>
            <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent format="percent" />} />
            <Bar dataKey="percentOfYears" radius={[4, 4, 0, 0]}>
              {rows.map((row) => (
                <Cell key={row.label} fill={bucketColor(row.minInclusive)} />
              ))}
              <LabelList
                dataKey="labelText"
                position="top"
                className="fill-foreground text-[10px] font-semibold"
              />
            </Bar>
          </BarChart>
        </ChartContainer>

        <div className="mt-2 grid text-center text-[11px] font-medium sm:grid-cols-2">
          <span className="text-red-700 dark:text-red-300">
            Negative buckets ({negativeCount})
          </span>
          <span className="text-emerald-700 dark:text-emerald-300">
            Positive buckets ({positiveCount})
          </span>
        </div>
      </div>
    </div>
  )
}
