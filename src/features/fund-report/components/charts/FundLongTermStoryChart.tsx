import { useMemo } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Label,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { MAX_CHART_POINTS } from '@/lib/constants'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { downsample } from '@/lib/utils'
import {
  buildLongTermStorySeries,
  computeLongTermStoryStats,
  formatStoryMultiple,
  formatStoryNavTick,
  type IndexedNavPoint,
} from '../../lib/overview/longTermStoryChart'

const chartConfig = {
  indexValue: { label: 'Growth index', color: 'var(--long-term-story-ink)' },
  trendValue: { label: 'CAGR trend', color: 'var(--long-term-story-trend)' },
} satisfies ChartConfig

type FundLongTermStoryChartProps = {
  fundName: string
  category: string
  fundAgeYears: number
  dataTo: string
  indexedNav: IndexedNavPoint[]
  loading?: boolean
}

function StoryTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: { label: string; indexValue: number; trendValue: number } }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  return (
    <div className="min-w-[200px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{point.label}</p>
      <p>
        Index: <span className="font-mono font-semibold">{point.indexValue.toFixed(1)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        CAGR path: {point.trendValue.toFixed(1)}
      </p>
    </div>
  )
}

export function FundLongTermStoryChart({
  fundName,
  category,
  fundAgeYears,
  dataTo,
  indexedNav,
  loading = false,
}: FundLongTermStoryChartProps) {
  const axis = useResponsiveAxis()

  const stats = useMemo(
    () => computeLongTermStoryStats(indexedNav, category, fundAgeYears),
    [indexedNav, category, fundAgeYears],
  )

  const chartData = useMemo(() => {
    const series = buildLongTermStorySeries(indexedNav)
    return downsample(series, MAX_CHART_POINTS)
  }, [indexedNav])

  if (loading && chartData.length === 0) {
    return <Skeleton className="mt-6 h-[460px] w-full rounded-xl" />
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

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className={CHART_PANEL_CLASS}>
        <h4 className="mb-3 text-center text-sm font-bold text-foreground">{chartTitle}</h4>

        <div className="relative">
          <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full sm:h-[380px]">
            <ComposedChart
              data={chartData}
              margin={chartPlotMargin({ top: 28, right: 16, bottom: 8, left: 4 })}
            >
              <CartesianGrid strokeDasharray="4 4" stroke={GRID_STROKE} vertical />
              <XAxis
                dataKey="label"
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={axis.tick}
                minTickGap={axis.xGap}
                height={axis.xHeight}
                angle={-90}
                textAnchor="end"
                interval="preserveStartEnd"
              >
                <Label {...xLabel('Date', -4)} />
              </XAxis>
              <YAxis
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={axis.tick}
                tickFormatter={formatStoryNavTick}
                width={axis.yWidth}
              >
                {axis.showYLabel ? <Label {...yLabel('Growth (base 100)')} /> : null}
              </YAxis>
              <Tooltip content={<StoryTooltip />} />
              <Line
                type="monotone"
                dataKey="indexValue"
                name="Fund growth"
                stroke="var(--long-term-story-ink)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="trendValue"
                name="CAGR trend"
                stroke="var(--long-term-story-trend)"
                strokeWidth={2}
                strokeDasharray="8 5"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>

          <div
            className="pointer-events-none absolute right-[6%] top-[14%] max-w-[220px] text-right sm:right-[10%] sm:top-[12%]"
            aria-hidden
          >
            <p
              className="text-sm font-bold leading-snug sm:text-base"
              style={{ color: 'var(--long-term-story-trend)' }}
            >
              Returns: {cagrText}% CAGR
            </p>
            <p
              className="mt-0.5 text-xs leading-snug sm:text-sm"
              style={{ color: 'var(--long-term-story-trend)' }}
            >
              (i.e. multiplied {multipleText} times in {yearsText} years)
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Source: Daily NAV history, Golden Triangle Analyzer. Updated as on {updatedOn}. Growth
          index rebased to 100 at fund inception in this window.
        </p>
      </div>
    </div>
  )
}
