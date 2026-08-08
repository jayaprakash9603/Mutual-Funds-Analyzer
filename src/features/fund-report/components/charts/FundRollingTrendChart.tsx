import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Label, ReferenceLine, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
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
  yLabelRight,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { DEFAULT_PERIOD, MAX_CHART_POINTS, PERIODS, type Period } from '@/lib/constants'
import { cn, downsample, parseNavDate } from '@/lib/utils'
import { mean } from '@/lib/analytics/navSeries'
import { ChartRangeToggle, type ChartRangeOption } from './ChartRangeToggle'

const FUND_COLOR = CHART_COLORS.fund
const CHART_HEIGHT_CLASS = 'aspect-auto h-[260px] w-full sm:h-[320px] lg:h-[360px]'
const GRADIENT_ID = 'fund-rolling-fill'

const chartConfig = {
  rollingReturn: { label: 'Rolling return', color: FUND_COLOR },
} satisfies ChartConfig

type RollingTrendPoint = {
  label: string
  windowRange: string
  rollingReturn: number
}

function RollingTooltip({
  active,
  payload,
  period,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: RollingTrendPoint }>
  period: Period
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const negative = point.rollingReturn < 0

  return (
    <div className="min-w-[230px] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{point.windowRange}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{period} rolling return</span>
        <span
          className={cn(
            'font-mono font-semibold tabular-nums',
            negative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
          )}
        >
          {point.rollingReturn.toFixed(2)}%
        </span>
      </p>
      <p className="mt-1 border-t border-border/70 pt-1 text-[10px] leading-relaxed text-muted-foreground">
        Annualised return an investor would have earned holding across this {period} window.
      </p>
    </div>
  )
}

export function FundRollingTrendChart({
  scheme,
  fundName,
  startDate,
  offlineView = false,
}: {
  scheme: string
  fundName: string
  startDate?: string
  offlineView?: boolean
}) {
  const axis = useResponsiveAxis()
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)
  const { data, result, loading, error } = useFundAnalysis(
    offlineView ? null : scheme,
    period,
    startDate,
  )

  const points = useMemo<RollingTrendPoint[]>(() => {
    if (!data) return []
    const mapped = data.fund.map((row) => {
      const start = parseNavDate(row.nav_date)
      const end = parseNavDate(row.scheme_forward_date)
      return {
        label: format(end, 'MMM yyyy'),
        windowRange: `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`,
        rollingReturn: row.scheme_rolling_returns,
      }
    })
    return downsample(mapped, MAX_CHART_POINTS)
  }, [data])

  const summary = useMemo(() => {
    if (!data || data.fund.length === 0) return null
    const returns = data.fund.map((row) => row.scheme_rolling_returns)
    return {
      average: mean(returns),
      best: Math.max(...returns),
      worst: Math.min(...returns),
      latest: returns[returns.length - 1]!,
      windowCount: returns.length,
    }
  }, [data])

  const options = useMemo<ChartRangeOption<Period>[]>(
    () => PERIODS.map((option) => ({ id: option, label: option.replace(' Year', 'Y') })),
    [],
  )

  const resolvedFundName = result?.fundName ?? fundName

  if (offlineView) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Rolling return trends need live rolling window data and are not included in shared snapshots.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading && points.length === 0 ? (
        <Skeleton className={cn(CHART_HEIGHT_CLASS, 'rounded-xl')} />
      ) : points.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No {period} rolling windows available for this fund.
        </p>
      ) : (
        <div className={CHART_INSET_CLASS}>
          <div className="flex flex-col gap-3 px-1 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                {resolvedFundName}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                  {summary ? `${summary.latest.toFixed(2)}%` : '—'}
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  latest {period} rolling return
                </span>
              </div>
            </div>

            {summary ? (
              <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm">
                <div>
                  <dt className="text-muted-foreground">Average</dt>
                  <dd className="font-mono font-semibold tabular-nums text-foreground">
                    {summary.average.toFixed(2)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Best</dt>
                  <dd className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {summary.best.toFixed(2)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Worst</dt>
                  <dd
                    className={cn(
                      'font-mono font-semibold tabular-nums',
                      summary.worst < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {summary.worst.toFixed(2)}%
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>

          <ChartContainer config={chartConfig} className={CHART_HEIGHT_CLASS}>
            <AreaChart data={points} margin={chartPlotMargin({ top: 12, right: 48, bottom: 8 })}>
              <defs>
                <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={FUND_COLOR} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={FUND_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis
                dataKey="label"
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={axis.tick}
                minTickGap={axis.xGap}
                height={axis.xHeight}
                tickFormatter={axis.formatMonthYearTick}
              >
                {axis.showXLabel ? <Label {...xLabel('Window end date', -2)} /> : null}
              </XAxis>
              <YAxis
                orientation="right"
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={axis.tick}
                width={axis.yWidth}
                domain={['auto', 'auto']}
                tickFormatter={axis.formatPercentTick}
              >
                {axis.showYLabel ? <Label {...yLabelRight('Return (%)')} /> : null}
              </YAxis>
              <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} strokeDasharray="4 4" />
              <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<RollingTooltip period={period} />} />
              <Area
                type="monotone"
                dataKey="rollingReturn"
                stroke={FUND_COLOR}
                strokeWidth={2}
                fill={`url(#${GRADIENT_ID})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: FUND_COLOR, stroke: 'var(--background)' }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      <ChartRangeToggle
        options={options}
        value={period}
        onChange={setPeriod}
        ariaLabel="Select rolling return window"
      />

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
        {summary
          ? `Every ${period} window ${resolvedFundName} has completed — ${summary.windowCount.toLocaleString('en-IN')} in total. `
          : ''}
        Each point is the annualised return for a window ending on that date. Fund only, no benchmark
        overlay.
      </p>
    </div>
  )
}
