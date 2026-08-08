import { useMemo } from 'react'
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { CHART_PANEL_RESPONSIVE_CLASS } from '@/lib/charts/chartSurface'
import { cn } from '@/lib/utils'
import {
  AXIS_LINE,
  CHART_HEIGHT_WIDE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import {
  buildLongTermStoryChartPoints,
  computeLongTermStoryStats,
  formatStoryFullDate,
  formatStoryMultiple,
  formatStoryNavTick,
  formatStoryNavValue,
  type IndexedNavPoint,
  type LongTermStoryChartPoint,
} from '../../lib/overview/longTermStoryChart'

const chartConfig = {
  indexValue: { label: 'Growth index', color: 'var(--long-term-story-ink)' },
} satisfies ChartConfig

const CHART_MARGIN = chartPlotMargin({ top: 12, right: 20, bottom: 12 })
const TOOLTIP_CURSOR = {
  stroke: 'var(--muted-foreground)',
  strokeWidth: 1,
  strokeDasharray: '4 4',
}

type FundLongTermStoryChartProps = {
  fundName: string
  category: string
  fundAgeYears: number
  latestNav: number
  dataTo: string
  indexedNav: IndexedNavPoint[]
  loading?: boolean
}

function StoryTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: LongTermStoryChartPoint }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-popover px-3 py-2.5 text-sm shadow-md">
      <p className="mb-2 font-medium text-foreground">{formatStoryFullDate(point.date)}</p>
      <div className="space-y-1 text-muted-foreground">
        <p>
          NAV:{' '}
          <span className="font-mono font-semibold text-foreground">
            ₹{formatStoryNavValue(point.nav)}
          </span>
        </p>
        <p>
          Growth index:{' '}
          <span className="font-mono font-semibold text-foreground">
            {point.indexValue.toFixed(1)}
          </span>
        </p>
      </div>
    </div>
  )
}

export function FundLongTermStoryChart({
  fundName,
  category,
  fundAgeYears,
  latestNav,
  dataTo,
  indexedNav,
  loading = false,
}: FundLongTermStoryChartProps) {
  const axis = useResponsiveAxis({ dense: true })

  const stats = useMemo(
    () => computeLongTermStoryStats(indexedNav, category, fundAgeYears),
    [indexedNav, category, fundAgeYears],
  )

  const chartData = useMemo(
    () => buildLongTermStoryChartPoints(indexedNav, latestNav),
    [indexedNav, latestNav],
  )

  const yDomainMax = useMemo(() => {
    const peak = Math.max(...chartData.map((point) => point.indexValue), 100)
    return Math.ceil((peak * 1.06) / 50) * 50
  }, [chartData])

  if (loading && chartData.length === 0) {
    return <Skeleton className={`mt-6 w-full rounded-xl ${CHART_HEIGHT_WIDE}`} />
  }

  if (!stats || chartData.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Long-term NAV history is not available yet for this chart.
      </p>
    )
  }

  const cagrText = stats.cagrPercent.toFixed(1)
  const multipleText = formatStoryMultiple(stats.moneyMultiple)
  const yearsText = `${stats.yearsRounded}+`
  const chartTitle = `${fundName} (Since ${stats.sinceLabel})`
  const updatedOn = dataTo.slice(0, 10)
  const srSummary = `Long-term growth chart for ${fundName}. ${chartData.length} daily NAV points. CAGR ${cagrText} percent, multiplied ${multipleText} times over ${yearsText} years.`

  return (
    <div className="mt-0 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm sm:mt-6">
      <div className={cn(CHART_PANEL_RESPONSIVE_CLASS, 'sm:border-0 sm:shadow-none')}>
        <h4 className="text-center text-sm font-bold text-foreground sm:text-base">{chartTitle}</h4>

        <div className="mx-auto mt-3 max-w-xl rounded-lg border border-[color-mix(in_srgb,var(--long-term-story-trend)_30%,transparent)] bg-[color-mix(in_srgb,var(--long-term-story-trend)_8%,transparent)] px-3 py-2 text-center">
          <p className="text-sm font-bold text-[var(--long-term-story-trend)] sm:text-base">
            Returns: {cagrText}% CAGR
          </p>
          <p className="mt-0.5 text-xs text-[var(--long-term-story-trend)]/90 sm:text-sm">
            Multiplied {multipleText} times in {yearsText} years
          </p>
        </div>

        <ChartContainer config={chartConfig} className={`mt-4 ${CHART_HEIGHT_WIDE}`} aria-label={srSummary}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID_STROKE} vertical />
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
            >
              <Label {...xLabel('Date', axis.xAngle === 0 ? 0 : -4)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={formatStoryNavTick}
              width={axis.yWidth}
              domain={[0, yDomainMax]}
            >
              {axis.showYLabel ? <Label {...yLabel('Growth (base 100)')} /> : null}
            </YAxis>
            <Tooltip content={<StoryTooltip />} cursor={TOOLTIP_CURSOR} />
            <Line
              type="monotone"
              dataKey="indexValue"
              name="Fund growth"
              stroke="var(--long-term-story-ink)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1.5, fill: 'var(--long-term-story-ink)', stroke: '#fff' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Source: Daily NAV history, Golden Triangle Analyzer. Updated as on {updatedOn}. Showing{' '}
          {chartData.length.toLocaleString('en-IN')} daily NAV points. Growth index rebased to 100 at
          fund inception. Hover or tap the line for NAV on any date.
        </p>
      </div>
    </div>
  )
}
