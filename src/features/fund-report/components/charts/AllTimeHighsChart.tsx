import { useMemo } from 'react'
import { CartesianGrid, Label, Line, LineChart, XAxis, YAxis } from 'recharts'
import { CHART_INSET_CLASS } from '@/lib/charts/chartSurface'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { ReportInsightCard } from '../layout/ReportInsightCard'
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
import type { FundReportRisk } from '../../schemas'

type AllTimeHighs = FundReportRisk['allTimeHighs']

const chartConfig = {
  nav: { label: 'NAV', color: CHART_COLORS.muted },
  athNav: { label: 'All-time high', color: CHART_COLORS.fund },
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

type AllTimeHighsChartProps = {
  allTimeHighs: AllTimeHighs
  fundName: string
}

export function AllTimeHighsChart({ allTimeHighs, fundName }: AllTimeHighsChartProps) {
  const isSmall = useIsSmallScreen()
  const chartRows = useMemo(
    () =>
      downsampleSeries(allTimeHighs.series).map((point) => ({
        ...point,
        athNav: point.allTimeHigh ? point.nav : null,
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
            <ChartTooltip
              cursor={CHART_TOOLTIP_CURSOR}
              content={<ChartTooltipContent />}
            />
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
              dataKey="athNav"
              stroke="transparent"
              dot={{ r: 3.5, fill: CHART_COLORS.fund, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>

        {!isSmall ? (
          <p className="pointer-events-none absolute bottom-6 right-6 max-w-[180px] text-right text-sm font-medium text-primary italic">
            green dots indicate All Time Highs
          </p>
        ) : null}
      </div>

      {isSmall ? (
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
