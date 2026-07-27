import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Label, LabelList, XAxis, YAxis } from 'recharts'
import type { LabelProps } from 'recharts'
import { ChartContainer, ChartTooltip, CHART_TOOLTIP_CURSOR } from '@/components/ui/chart'
import {
  AXIS_LINE,
  formatAxisPercentTick,
  GRID_STROKE,
  MARGIN_LEFT,
  TICK_LINE,
  TICK_MD,
  yLabel,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { CHART_BUCKET_NEGATIVE_BORDER, CHART_BUCKET_POSITIVE_BORDER } from '@/lib/charts/chartSurface'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReportPerformance } from '../../schemas'
import { ReportInsightCard } from '../layout/ReportInsightCard'

type Insights = FundReportPerformance['calendarYearInsights']
type Bucket = Insights['distribution']['buckets'][number]

type BucketRow = Bucket & {
  shortLabel: string
}

type AnnualReturnDistributionChartProps = {
  distribution: Insights['distribution']
  fundName: string
}

function shortBucketLabel(label: string) {
  return label
    .replace(' or better', '+')
    .replace(' or worse', '−')
}

function BucketBarLabel({
  x = 0,
  y = 0,
  width = 0,
  index = 0,
  rows,
  tone,
}: LabelProps & { rows: BucketRow[]; tone: 'negative' | 'positive' }) {
  const row = rows[index ?? 0]
  if (!row || row.yearCount === 0) return null

  const fill = tone === 'negative' ? CHART_COLORS.red : CHART_COLORS.fund
  const cx = Number(x) + Number(width) / 2

  return (
    <g>
      <text
        x={cx}
        y={Number(y) - 18}
        textAnchor="middle"
        fill={fill}
        fontSize={12}
        fontWeight={700}
      >
        {formatPercent(row.percentOfYears, 0)}
      </text>
      <text
        x={cx}
        y={Number(y) - 6}
        textAnchor="middle"
        fill={fill}
        fontSize={10}
        fontWeight={600}
      >
        ({row.yearCount}Y)
      </text>
    </g>
  )
}

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: BucketRow }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{row.label}</p>
      <p className="mt-1 tabular-nums text-muted-foreground">
        {formatPercent(row.percentOfYears, 0)} of years ({row.yearCount} calendar{' '}
        {row.yearCount === 1 ? 'year' : 'years'})
      </p>
    </div>
  )
}

function BracketHeader({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: 'negative' | 'positive'
}) {
  const border = tone === 'negative' ? 'border-red-400/80' : 'border-emerald-500/80'
  const text = tone === 'negative' ? 'text-red-800 dark:text-red-200' : 'text-emerald-800 dark:text-emerald-200'

  return (
    <div className="mb-0 flex justify-center px-2">
      <div
        className={cn(
          'relative max-w-full rounded-t-xl border-t-2 border-x-2 px-4 pb-2 pt-2 text-center',
          border,
        )}
      >
        <p className={cn('text-xs font-semibold leading-snug sm:text-sm', text)}>{children}</p>
      </div>
    </div>
  )
}

function BucketGroupCard({
  tone,
  summary,
  buckets,
}: {
  tone: 'negative' | 'positive'
  summary: string
  buckets: BucketRow[]
}) {
  if (buckets.length === 0) return null

  const barColor = tone === 'negative' ? CHART_COLORS.red : CHART_COLORS.fund
  const border =
    tone === 'negative' ? CHART_BUCKET_NEGATIVE_BORDER : CHART_BUCKET_POSITIVE_BORDER
  const maxY = Math.max(...buckets.map((bucket) => bucket.percentOfYears), 5)

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <BracketHeader tone={tone}>{summary}</BracketHeader>
      <div
        className={cn(
          '-mt-px flex flex-1 flex-col rounded-xl rounded-t-none border-2 bg-[var(--chart-surface)] p-3 sm:p-4',
          border,
        )}
      >
        <ChartContainer
          config={{ percentOfYears: { label: '% of years', color: barColor } }}
          className="aspect-auto h-[240px] w-full sm:h-[280px]"
        >
          <BarChart
            data={buckets}
            margin={{ ...MARGIN_LEFT, top: 40, right: 8, bottom: 4 }}
            barCategoryGap="18%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="shortLabel"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={{ ...TICK_MD, fontSize: 10 }}
              interval={0}
              height={56}
            />
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatAxisPercentTick}
              width={40}
              domain={[0, Math.ceil(maxY * 1.15)]}
            >
              <Label {...yLabel('% of years')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<DistributionTooltip />} />
            <Bar dataKey="percentOfYears" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {buckets.map((row) => (
                <Cell key={row.label} fill={barColor} />
              ))}
              <LabelList
                content={(props) => (
                  <BucketBarLabel {...props} rows={buckets} tone={tone} />
                )}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}

export function AnnualReturnDistributionChart({
  distribution,
  fundName,
}: AnnualReturnDistributionChartProps) {
  const { negativeBuckets, positiveBuckets } = useMemo(() => {
    const withLabels = distribution.buckets
      .filter((bucket) => bucket.yearCount > 0)
      .map((bucket) => ({
        ...bucket,
        shortLabel: shortBucketLabel(bucket.label),
      }))

    return {
      negativeBuckets: withLabels.filter((bucket) => bucket.minInclusive < 0),
      positiveBuckets: withLabels.filter((bucket) => bucket.minInclusive >= 0),
    }
  }, [distribution.buckets])

  if (negativeBuckets.length === 0 && positiveBuckets.length === 0) {
    return null
  }

  const negativeSummary = `${formatPercent(distribution.negativeYearsPercent, 0)} of the years (${distribution.negativeYearCount}Y) with negative returns`
  const positiveSummary = `${formatPercent(distribution.positiveYearsPercent, 0)} of the years (${distribution.positiveYearCount}Y) with positive returns`

  const headlineCallout = distribution.headline ? (
    <p className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm leading-relaxed text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
      {distribution.headline}
    </p>
  ) : null

  return (
    <ReportInsightCard
      title="Calendar-year returns are positive in most years — but spread widely"
      subtitle={`${fundName} · ${distribution.totalYears} calendar years · return distribution by bucket`}
      callout={headlineCallout}
      footer="% of years with annual return in each bucket. Only buckets with at least one calendar year are shown."
    >
      <div
        className={cn(
          'grid gap-5',
          negativeBuckets.length > 0 && positiveBuckets.length > 0
            ? 'md:grid-cols-2'
            : 'max-w-2xl',
        )}
      >
        {negativeBuckets.length > 0 ? (
          <BucketGroupCard tone="negative" summary={negativeSummary} buckets={negativeBuckets} />
        ) : null}
        {positiveBuckets.length > 0 ? (
          <BucketGroupCard tone="positive" summary={positiveSummary} buckets={positiveBuckets} />
        ) : null}
      </div>
    </ReportInsightCard>
  )
}
