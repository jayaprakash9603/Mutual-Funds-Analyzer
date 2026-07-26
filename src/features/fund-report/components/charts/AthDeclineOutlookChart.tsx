import { useMemo } from 'react'
import { CartesianGrid, Label, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
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
import { formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'

type AllTimeHighs = FundReportRisk['allTimeHighs']

const chartConfig = {
  nav: { label: 'NAV', color: CHART_COLORS.muted },
  fellNav: { label: 'Saw 10% lower', color: CHART_COLORS.fund },
  neverFellNav: { label: 'Never fell 10% lower', color: CHART_COLORS.red },
}

function downsampleSeries(
  rows: AllTimeHighs['series'],
  maxPoints = 900,
): AllTimeHighs['series'] {
  if (rows.length <= maxPoints) {
    return rows
  }
  const stride = Math.ceil(rows.length / maxPoints)
  const sampled: AllTimeHighs['series'] = []
  for (let i = 0; i < rows.length; i += stride) {
    sampled.push(rows[i]!)
  }
  for (const row of rows) {
    if (row.allTimeHigh && !sampled.includes(row)) {
      sampled.push(row)
    }
  }
  return sampled.sort((a, b) => a.date.localeCompare(b.date))
}

type AthDeclineOutlookChartProps = {
  allTimeHighs: AllTimeHighs
  fundName: string
}

export function AthDeclineOutlookChart({ allTimeHighs, fundName }: AthDeclineOutlookChartProps) {
  const outlook = allTimeHighs.athDeclineOutlook

  const chartRows = useMemo(
    () =>
      downsampleSeries(allTimeHighs.series).map((point) => ({
        ...point,
        fellNav:
          point.allTimeHigh && point.fellBelowThreshold === true ? point.nav : null,
        neverFellNav:
          point.allTimeHigh && point.fellBelowThreshold === false ? point.nav : null,
        year: point.date.slice(0, 4),
      })),
    [allTimeHighs.series],
  )

  const yearTicks = useMemo(() => {
    const years = [...new Set(chartRows.map((row) => row.year))]
    if (years.length <= 12) {
      return years
    }
    const step = Math.ceil(years.length / 12)
    return years.filter((_, index) => index % step === 0)
  }, [chartRows])

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
          Never saw {formatPercent(outlook.declineThresholdPercent, 0)} lower levels from these all-time highs
        </span>
      </div>

      <div className="relative w-full rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full sm:h-[380px]">
          <LineChart data={chartRows} margin={{ ...MARGIN_LEFT, top: 12, right: 24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="year"
              ticks={yearTicks}
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              interval="preserveStartEnd"
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
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="nav"
              stroke={CHART_COLORS.muted}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="fellNav"
              stroke="transparent"
              dot={{ r: 3.5, fill: CHART_COLORS.fund, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="neverFellNav"
              stroke="transparent"
              dot={{ r: 3.5, fill: CHART_COLORS.red, strokeWidth: 0 }}
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
          <p className="text-muted-foreground">Never fell {formatPercent(outlook.declineThresholdPercent, 0)} below</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {outlook.neverFellCount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Share without a {formatPercent(outlook.declineThresholdPercent, 0)} fall</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {formatPercent(outlook.neverFellPercent, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
