import { useMemo } from 'react'
import { CartesianGrid, Label, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import {
  AXIS_LINE,
  GRID_STROKE,
  MARGIN_LEFT,
  TICK_LINE,
  TICK_MD,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { cn, formatPercent } from '@/lib/utils'
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
  fellNav: { label: 'Saw 10% lower', color: CHART_COLORS.fund },
  neverFellNav: { label: 'Never fell 10% lower', color: CHART_COLORS.red },
}

function AthActiveDot({
  cx,
  cy,
  value,
  fill,
}: {
  cx?: number
  cy?: number
  value?: number | null
  fill: string
}) {
  if (value == null || cx == null || cy == null) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={7}
      fill={fill}
      stroke="var(--background)"
      strokeWidth={2}
      className="drop-shadow-sm"
    />
  )
}

function DeclineAthTooltip({
  active,
  payload,
  thresholdPercent,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: AthChartRow }>
  thresholdPercent: number
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const thresholdLabel = formatPercent(thresholdPercent, 0)
  let status = 'Below prior peak'
  let statusClass = 'bg-muted/60 text-muted-foreground'
  if (point.allTimeHigh && point.fellBelowThreshold === true) {
    status = `Saw ${thresholdLabel} lower later`
    statusClass = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  } else if (point.allTimeHigh && point.fellBelowThreshold === false) {
    status = `Never saw ${thresholdLabel} lower`
    statusClass = 'bg-red-500/15 text-red-700 dark:text-red-300'
  } else if (point.allTimeHigh) {
    status = 'All-time high day'
    statusClass = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  }

  return (
    <div className="z-50 min-w-[12rem] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{formatAthChartDate(point.date)}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">NAV</span>
          <span className="font-mono font-semibold tabular-nums">{point.nav.toFixed(2)}</span>
        </div>
        <div className={cn('mt-1 rounded-md px-2 py-1 font-medium', statusClass)}>{status}</div>
      </div>
    </div>
  )
}

type AthDeclineOutlookChartProps = {
  allTimeHighs: AllTimeHighs
  fundName: string
}

export function AthDeclineOutlookChart({ allTimeHighs, fundName }: AthDeclineOutlookChartProps) {
  const outlook = allTimeHighs.athDeclineOutlook

  const chartRows = useMemo(() => toAthChartRows(allTimeHighs.series), [allTimeHighs.series])
  const yearTicks = useMemo(() => athYearTicks(chartRows), [chartRows])

  if (chartRows.length === 0 || outlook.totalAthInstances === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          Reaching an all-time high rarely marks the top
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {fundName} — all-time highs since {chartRows[0]?.year} ({allTimeHighs.periodLabel})
        </p>
      </div>

      {outlook.headline ? (
        <p className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm leading-relaxed text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
          {outlook.headline}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-emerald-600" aria-hidden="true" />
          Saw {formatPercent(outlook.declineThresholdPercent, 0)} lower levels from these all-time highs
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-red-600" aria-hidden="true" />
          Never saw {formatPercent(outlook.declineThresholdPercent, 0)} lower levels from these
          all-time highs
        </span>
      </div>

      <div className={`relative w-full ${CHART_PANEL_CLASS}`}>
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
              tick={TICK_MD}
              interval="preserveStartEnd"
              tickFormatter={(value: string) => String(value).slice(0, 4)}
            >
              <Label {...xLabel('Year')} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={(value) => Number(value).toFixed(0)}
              width={56}
            >
              <Label {...yLabel('NAV')} />
            </YAxis>
            <ChartTooltip
              cursor={CHART_TOOLTIP_CURSOR}
              shared
              content={
                <DeclineAthTooltip thresholdPercent={outlook.declineThresholdPercent} />
              }
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
              dataKey="fellNav"
              name="Saw 10% lower"
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
                />
              )}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="neverFellNav"
              name="Never fell 10% lower"
              stroke="transparent"
              strokeWidth={0}
              legendType="none"
              dot={{ r: 3.5, fill: CHART_COLORS.red, strokeWidth: 0 }}
              activeDot={(props) => (
                <AthActiveDot
                  cx={props.cx}
                  cy={props.cy}
                  value={typeof props.value === 'number' ? props.value : null}
                  fill={CHART_COLORS.red}
                />
              )}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">All-time high instances</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {outlook.totalAthInstances.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Never fell {formatPercent(outlook.declineThresholdPercent, 0)} below
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {outlook.neverFellCount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Share without a {formatPercent(outlook.declineThresholdPercent, 0)} fall
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {formatPercent(outlook.neverFellPercent, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
