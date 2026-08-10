import { useMemo } from 'react'
import { CartesianGrid, Label, Line, LineChart, XAxis, YAxis } from 'recharts'
import { CHART_INSET_CLASS } from '@/lib/charts/chartSurface'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { ReportInsightCard } from '../layout/ReportInsightCard'
import {
  ChartContainer,
  ChartTooltip,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import {
  AXIS_LINE,
  GRID_STROKE,
  MARGIN_LEFT,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { cn } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'
import {
  athYearTicks,
  formatAthChartDate,
  toAthChartRows,
  type AthChartRow,
} from '../../lib/risk/athChartSeries'

type AllTimeHighs = FundReportRisk['allTimeHighs']

const chartConfig = {
  nav: { label: 'NAV', color: CHART_COLORS.muted },
  athNav: { label: 'All-time high', color: CHART_COLORS.fund },
}

function AthActiveDot({
  cx,
  cy,
  value,
  fill,
  r = 6,
}: {
  cx?: number
  cy?: number
  value?: number | null
  fill: string
  r?: number
}) {
  if (value == null || cx == null || cy == null) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke="var(--background)"
      strokeWidth={2}
      className="drop-shadow-sm"
    />
  )
}

function AthTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: AthChartRow }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="z-50 min-w-[11rem] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{formatAthChartDate(point.date)}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">NAV</span>
          <span className="font-mono font-semibold tabular-nums">{point.nav.toFixed(2)}</span>
        </div>
        <div
          className={cn(
            'mt-1 rounded-md px-2 py-1 font-medium',
            point.allTimeHigh
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-muted/60 text-muted-foreground',
          )}
        >
          {point.allTimeHigh ? 'All-time high day' : 'Below prior peak'}
        </div>
      </div>
    </div>
  )
}

type AllTimeHighsChartProps = {
  allTimeHighs: AllTimeHighs
  fundName: string
}

export function AllTimeHighsChart({ allTimeHighs, fundName }: AllTimeHighsChartProps) {
  const axis = useResponsiveAxis()
  const chartRows = useMemo(() => toAthChartRows(allTimeHighs.series), [allTimeHighs.series])
  const yearTicks = useMemo(() => athYearTicks(chartRows), [chartRows])

  if (chartRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Need NAV history to chart all-time highs for {fundName}.
      </p>
    )
  }

  return (
    <ReportInsightCard
      title="Equity markets regularly hit ‘All Time Highs’"
      subtitle={`${fundName} — all-time highs since ${chartRows[0]?.year} (${allTimeHighs.periodLabel})`}
    >
      {allTimeHighs.summary.headline ? (
        <p className="rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-3 py-2.5 text-sm leading-relaxed text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100 sm:px-4 sm:py-3">
          {allTimeHighs.summary.headline}
        </p>
      ) : null}

      <div className={`relative w-full ${CHART_INSET_CLASS}`}>
        <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full sm:h-[380px]">
          <LineChart data={chartRows} margin={{ ...MARGIN_LEFT, top: 12, right: 24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="date"
              type="category"
              allowDuplicatedCategory={false}
              ticks={yearTicks}
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              interval="preserveStartEnd"
              tickFormatter={(value: string) =>
                axis.compact ? `'${String(value).slice(2, 4)}` : String(value).slice(0, 4)
              }
            >
              {axis.showXLabel ? <Label {...xLabel('Year')} /> : null}
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={(value) => Number(value).toFixed(0)}
              width={axis.yWidth}
            >
              {axis.showYLabel ? <Label {...yLabel('NAV')} /> : null}
            </YAxis>
            <ChartTooltip
              cursor={CHART_TOOLTIP_CURSOR}
              shared
              content={<AthTooltip />}
            />
            <Line
              type="monotone"
              dataKey="nav"
              stroke={CHART_COLORS.muted}
              strokeWidth={1.5}
              dot={false}
              activeDot={{
                r: 4,
                fill: CHART_COLORS.muted,
                stroke: 'var(--background)',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="athNav"
              name="All-time high"
              stroke="transparent"
              strokeWidth={0}
              legendType="none"
              dot={{ r: 3.5, fill: CHART_COLORS.fund, strokeWidth: 0 }}
              activeDot={(props) => (
                <AthActiveDot
                  cx={props.cx}
                  cy={props.cy}
                  value={typeof props.value === 'number' ? props.value : null}
                  fill={CHART_COLORS.fund}
                  r={7}
                />
              )}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>

        {!axis.isSmall ? (
          <p className="pointer-events-none absolute bottom-6 right-6 max-w-[180px] text-right text-sm font-medium text-primary italic">
            green dots indicate All Time Highs
          </p>
        ) : null}
      </div>

      {axis.isSmall ? (
        <p className="text-center text-sm font-medium text-primary italic">
          green dots indicate All Time Highs
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">ATH trading days</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {allTimeHighs.summary.totalAllTimeHighDays.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Years with a new high</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {allTimeHighs.summary.yearsWithNewHigh}/{allTimeHighs.summary.calendarYears}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Share of calendar years</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {allTimeHighs.summary.yearsWithNewHighPercent.toFixed(0)}%
          </p>
        </div>
      </div>
    </ReportInsightCard>
  )
}
