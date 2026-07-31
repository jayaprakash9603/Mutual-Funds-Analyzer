import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Label, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  CHART_TOOLTIP_CURSOR,
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppMetricGrid } from '@/components/ui/AppMetricGrid'
import { ChartShell, chartHeightForGuide } from '@/components/charts/ChartShell'
import { CHART_GUIDES } from '@/lib/analytics/chartGuide'
import {
  getRollingReturnDistribution,
  type RollingDistributionBin,
} from '@/lib/analytics/rollingReturnsAnalysis'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  MARGIN_X,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { DEFAULT_PERIOD, PERIODS, type Period } from '@/lib/constants'
import { formatPercent } from '@/lib/utils'
import { MetricTile } from '../layout/SectionShell'

const chartConfig = {
  count: { label: 'Windows', color: CHART_COLORS.fund },
} satisfies ChartConfig

/** Headroom above the plot so the average annotation is not clipped by the chart edge. */
const CHART_MARGIN = { ...MARGIN_X, top: 28 }

function binColor(bin: RollingDistributionBin) {
  if (bin.binEnd <= 0) return CHART_COLORS.red
  if (bin.binStart < 0) return CHART_COLORS.amber
  return CHART_COLORS.fund
}

/** The final bin owns its upper bound, so an average equal to the best window still lands. */
function binForValue(bins: readonly RollingDistributionBin[], value: number) {
  return bins.find(
    (bin, index) => value >= bin.binStart && (value < bin.binEnd || index === bins.length - 1),
  )
}

function DistributionTooltip({
  active,
  payload,
  period,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: RollingDistributionBin }>
  period: Period
}) {
  if (!active || !payload?.length) return null
  const bin = payload[0]?.payload
  if (!bin) return null

  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">
        {bin.binStart.toFixed(1)}% to {bin.binEnd.toFixed(1)}%
      </p>
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Windows</span>
        <span className="font-mono font-semibold tabular-nums">{bin.count}</span>
      </p>
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Share of history</span>
        <span className="font-mono font-semibold tabular-nums">{bin.percentOfWindows.toFixed(1)}%</span>
      </p>
      <p className="mt-1 border-t border-border/70 pt-1 text-[10px] leading-relaxed text-muted-foreground">
        {bin.count} of the {period} rolling windows landed in this return band.
      </p>
    </div>
  )
}

export function RollingReturnDistributionChart({
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
  const axis = useResponsiveAxis({ dense: true })
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)
  const { data, result, loading, error } = useFundAnalysis(
    offlineView ? null : scheme,
    period,
    startDate,
  )

  const distribution = useMemo(
    () => (data ? getRollingReturnDistribution({ fund: data.fund, benchmark: data.benchmark, period }) : null),
    [data, period],
  )

  const resolvedFundName = result?.fundName ?? fundName

  if (offlineView) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        The rolling return distribution needs live rolling window data and is not included in shared snapshots.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Every {period} rolling window {resolvedFundName} has ever completed, grouped into return bands so you can
          see which outcomes were common and which were rare.
        </p>
        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger className="w-full sm:w-[140px]" aria-label="Rolling window">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {distribution ? (
        <AppMetricGrid>
          <MetricTile
            label="Average"
            value={formatPercent(distribution.stats.average)}
            hint={`Mean of all ${distribution.windowCount} ${period} windows`}
          />
          <MetricTile
            label="Median"
            value={formatPercent(distribution.stats.median)}
            hint="Half the windows landed above this return"
          />
          <MetricTile
            label="Spread"
            value={`${formatPercent(distribution.stats.minimum)} to ${formatPercent(distribution.stats.maximum)}`}
            valueVariant="text"
            hint="Worst and best window in the series"
          />
          <MetricTile
            label="Negative windows"
            value={`${distribution.negativePercent.toFixed(1)}%`}
            hint={`${distribution.negativeCount} windows finished below zero`}
          />
        </AppMetricGrid>
      ) : null}

      <ChartShell
        guide={CHART_GUIDES.distribution}
        variant="flat"
        loading={loading && !distribution}
        empty={!loading && !distribution}
        footer={
          distribution ? (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/70 pt-3 text-[11px] sm:text-xs">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-[2px]" style={{ backgroundColor: CHART_COLORS.red }} aria-hidden="true" />
                Loss band
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-[2px]" style={{ backgroundColor: CHART_COLORS.amber }} aria-hidden="true" />
                Straddles zero
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-[2px]" style={{ backgroundColor: CHART_COLORS.fund }} aria-hidden="true" />
                Gain band
              </span>
              <span className="text-muted-foreground">
                Most common band:{' '}
                <span className="font-semibold text-foreground">
                  {distribution.modalBin.binStart.toFixed(1)}% to {distribution.modalBin.binEnd.toFixed(1)}%
                </span>{' '}
                ({distribution.modalBin.percentOfWindows.toFixed(1)}% of windows)
              </span>
            </div>
          ) : null
        }
      >
        <ChartContainer config={chartConfig} className={chartHeightForGuide(CHART_GUIDES.distribution)}>
          <BarChart data={distribution?.bins ?? []} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              angle={axis.xAngle}
              textAnchor={axis.xAnchor}
              height={axis.xHeight}
              minTickGap={axis.xGap}
            >
              <Label {...xLabel('Return band (%)', axis.xAngle === 0 ? -4 : -8)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} width={axis.yWidth} allowDecimals={false}>
              {axis.showYLabel ? <Label {...yLabel('Number of windows')} /> : null}
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<DistributionTooltip period={period} />} />
            {distribution ? (
              <ReferenceLine
                x={binForValue(distribution.bins, distribution.stats.average)?.label}
                stroke={CHART_COLORS.muted}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                label={{
                  value: `Average ${distribution.stats.average.toFixed(1)}%`,
                  position: 'top',
                  fill: 'var(--foreground)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            ) : null}
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {(distribution?.bins ?? []).map((bin) => (
                <Cell key={bin.label} fill={binColor(bin)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartShell>
    </div>
  )
}
