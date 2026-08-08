import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Label, ReferenceLine, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CHART_TOOLTIP_CURSOR,
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { CHART_INSET_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  TICK_LINE,
  ZERO_LINE_STROKE,
  chartPlotMargin,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { cn } from '@/lib/utils'
import {
  DEFAULT_GROWTH_RANGE,
  GROWTH_RANGES,
  availableGrowthRanges,
  buildGrowthTrend,
  longestAvailableRange,
  type GrowthRangeId,
  type GrowthTrendPoint,
  type IndexedNavInput,
} from '../../lib/returns/growthRange'
import { ChartRangeToggle, type ChartRangeOption } from './ChartRangeToggle'

const GAIN_COLOR = CHART_COLORS.fund
const LOSS_COLOR = CHART_COLORS.red
const CHART_HEIGHT_CLASS = 'aspect-auto h-[260px] w-full sm:h-[320px] lg:h-[360px]'
const GRADIENT_ID = 'fund-growth-fill'

const chartConfig = {
  indexValue: { label: 'Growth', color: GAIN_COLOR },
} satisfies ChartConfig

function formatSignedPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function GrowthTooltip({
  active,
  payload,
  accent,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: GrowthTrendPoint }>
  accent: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="min-w-[210px] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">
        {format(parseISO(point.date), 'd MMM yyyy')}
      </p>
      {point.nav != null ? (
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">NAV</span>
          <span className="font-mono font-semibold tabular-nums">₹{point.nav.toFixed(2)}</span>
        </p>
      ) : null}
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Value of ₹10,000</span>
        <span className="font-mono font-semibold tabular-nums">
          {formatRupees((point.indexValue / 100) * 10_000)}
        </span>
      </p>
      <p className="mt-1 flex items-center justify-between gap-4 border-t border-border/70 pt-1">
        <span className="text-muted-foreground">Since window start</span>
        <span className="font-mono font-semibold tabular-nums" style={{ color: accent }}>
          {formatSignedPercent(point.changePercent)}
        </span>
      </p>
    </div>
  )
}

export function FundGrowthTrendChart({
  fundName,
  indexedNav,
  loading = false,
}: {
  fundName: string
  indexedNav: IndexedNavInput[]
  loading?: boolean
}) {
  const axis = useResponsiveAxis()
  const [range, setRange] = useState<GrowthRangeId>(DEFAULT_GROWTH_RANGE)
  // Recreate when the window changes so year-on-change tick state starts clean.
  const available = useMemo(() => availableGrowthRanges(indexedNav), [indexedNav])
  // A short-history fund may not cover the default window, so fall back instead of blanking.
  const effectiveRange = available.has(range) ? range : (longestAvailableRange(indexedNav) ?? range)
  const trend = useMemo(() => buildGrowthTrend(indexedNav, effectiveRange), [indexedNav, effectiveRange])
  // Recreate when the window changes so year-on-change tick state starts clean.
  const xTickFormatter = useMemo(
    () => axis.createTimeTickFormatter(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: reset with window/axis mode
    [axis.compact, effectiveRange, trend?.startDate, trend?.endDate],
  )

  const options = useMemo<ChartRangeOption<GrowthRangeId>[]>(
    () =>
      GROWTH_RANGES.map((option) => ({
        id: option.id,
        label: option.label,
        disabled: !available.has(option.id),
      })),
    [available],
  )

  if (loading && indexedNav.length === 0) {
    return <Skeleton className={cn(CHART_HEIGHT_CLASS, 'rounded-xl')} />
  }

  if (!trend) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Daily NAV history is not available yet for the growth chart.
      </p>
    )
  }

  const positive = trend.changePercent >= 0
  const accent = positive ? GAIN_COLOR : LOSS_COLOR

  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      {/* Nested inside ReportInsightCard — inset only, no second bordered frame. */}
      <div className={cn(CHART_INSET_CLASS, 'min-w-0')}>
        <div className="flex flex-col gap-3 px-1 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{fundName}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className="font-mono text-2xl font-bold tabular-nums sm:text-3xl"
                style={{ color: accent }}
              >
                {formatSignedPercent(trend.changePercent)}
              </span>
              {positive ? (
                <ArrowUpRight className="size-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
              ) : (
                <ArrowDownRight className="size-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
              )}
              <span className="text-xs text-muted-foreground sm:text-sm">
                {axis.isSmall
                  ? `${format(parseISO(trend.startDate), 'd MMM yy')} – ${format(parseISO(trend.endDate), 'd MMM yy')}`
                  : `${format(parseISO(trend.startDate), 'd MMM yyyy')} – ${format(parseISO(trend.endDate), 'd MMM yyyy')}`}
              </span>
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm">
            <div>
              <dt className="text-muted-foreground">₹10,000 becomes</dt>
              <dd className="font-mono font-semibold tabular-nums text-foreground">
                {formatRupees(trend.valueOf10k)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Annualised</dt>
              <dd className="font-mono font-semibold tabular-nums text-foreground">
                {trend.cagrPercent == null ? '—' : `${trend.cagrPercent.toFixed(2)}%`}
              </dd>
            </div>
          </dl>
        </div>

        <ChartContainer config={chartConfig} className={cn(CHART_HEIGHT_CLASS, 'min-w-0 max-w-full')}>
          <AreaChart
            data={trend.points}
            margin={chartPlotMargin({
              top: 12,
              right: axis.isSmall ? 4 : 12,
              bottom: axis.isSmall ? 0 : 8,
            })}
          >
            <defs>
              <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
            <XAxis
              dataKey="date"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              minTickGap={axis.xGap}
              height={axis.xHeight}
              interval="preserveStartEnd"
              tickFormatter={xTickFormatter}
            >
              {axis.showXLabel ? <Label {...xLabel('Date', -2)} /> : null}
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              width={axis.yWidth}
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => value.toFixed(0)}
            >
              {axis.showYLabel ? <Label {...yLabel('Growth (start = 100)')} /> : null}
            </YAxis>
            <ReferenceLine y={100} stroke={ZERO_LINE_STROKE} strokeDasharray="4 4" />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<GrowthTooltip accent={accent} />} />
            <Area
              type="monotone"
              dataKey="indexValue"
              stroke={accent}
              strokeWidth={2}
              fill={`url(#${GRADIENT_ID})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: accent, stroke: 'var(--background)' }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <ChartRangeToggle
        options={options}
        value={effectiveRange}
        onChange={setRange}
        ariaLabel="Select growth chart time range"
      />

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
        Rebased to 100 on {format(parseISO(trend.startDate), 'd MMM yyyy')}, so the line reads as growth
        across the selected window. Best point {formatSignedPercent(trend.peakChangePercent)}, weakest{' '}
        {formatSignedPercent(trend.troughChangePercent)}. Greyed-out ranges exceed this fund&apos;s history.
      </p>
    </div>
  )
}
