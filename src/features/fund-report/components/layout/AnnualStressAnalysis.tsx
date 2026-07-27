import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import { CHART_COLORS, signedReturnColor } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  formatAxisPercentTick,
  GRID_STROKE,
  MARGIN_LEFT,
  TICK_LINE,
  TICK_MD,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReport } from '../../schemas'
import {
  buildAnnualStressHeadline,
  computeAnnualStressStats,
  type CalendarYearRow,
} from '../../lib/stress/annualStressAnalysis'
import { AnnualStressInfographicCard } from '../charts/AnnualStressInfographicCard'

type CalendarYears = FundReport['consistency']['calendarYears']

const drawdownChartConfig = {
  intraYearDrawdown: { label: 'Max intra-year drawdown', color: CHART_COLORS.red },
}

const returnChartConfig = {
  returnPercent: { label: 'Calendar year return', color: CHART_COLORS.fund },
}

interface AnnualStressAnalysisProps {
  calendarYears: CalendarYears
  fundName: string
  dataTo?: string
  maxYears?: number
}

export function AnnualStressAnalysis({
  calendarYears,
  fundName,
  dataTo,
  maxYears = 20,
}: AnnualStressAnalysisProps) {
  const rows = useMemo(() => {
    const sliced = calendarYears.slice(-maxYears)
    const lastYear = dataTo ? new Date(dataTo).getUTCFullYear() : null
    const lastMonth = dataTo ? new Date(dataTo).getUTCMonth() : 11

    return sliced.map((row) => ({
      ...row,
      drawdownLabel: Math.abs(row.intraYearDrawdown),
      isPartialYear: lastYear === row.year && lastMonth < 11,
    }))
  }, [calendarYears, dataTo, maxYears])

  const stats = useMemo(() => computeAnnualStressStats(rows), [rows])
  const headline = useMemo(() => buildAnnualStressHeadline(stats, fundName), [stats, fundName])

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No calendar-year history available.</p>
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 px-5 py-4 dark:border-sky-900/50 dark:bg-sky-950/20">
        <p className="text-sm font-semibold leading-relaxed text-sky-950 dark:text-sky-100">
          {headline}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatPill
            label="Years with ≥10% intra-year fall"
            value={`${stats.yearsWithTenPlusDrawdown}/${stats.totalYears}`}
          />
          <StatPill
            label="Years ending positive"
            value={`${stats.positiveYears}/${stats.totalYears} (${stats.positiveYearRate.toFixed(0)}%)`}
            tone="good"
          />
          <StatPill
            label="Average intra-year drawdown"
            value={formatPercent(-stats.averageDrawdown)}
            tone="warn"
          />
        </div>
      </div>

      <div className="grid gap-0 overflow-hidden rounded-xl border border-border/70 bg-[var(--chart-surface)] shadow-inner lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="border-b border-slate-700/60 p-3 sm:p-4 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Intra-year maximum drawdown
          </p>
          <ChartContainer config={drawdownChartConfig} className="aspect-auto h-[200px] w-full sm:h-[220px]">
            <BarChart data={rows} margin={{ ...MARGIN_LEFT, top: 12, bottom: 0, left: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="year" hide />
              <YAxis
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={TICK_MD}
                tickFormatter={formatAxisPercentTick}
                width={44}
                domain={['dataMin', 0]}
                type="number"
              >
                <Label {...yLabel('Drawdown (%)')} />
              </YAxis>
              <ReferenceLine
                y={-stats.averageDrawdown}
                stroke={CHART_COLORS.blue}
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: `Avg ${stats.averageDrawdown.toFixed(0)}%`,
                  position: 'insideTopRight',
                  fill: CHART_COLORS.blue,
                  fontSize: 11,
                }}
              />
              <ChartTooltip
                cursor={CHART_TOOLTIP_CURSOR}
                content={
                  <ChartTooltipContent
                    format="percent"
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as CalendarYearRow | undefined
                      return row ? `Year ${row.year}` : ''
                    }}
                  />
                }
              />
              <Bar
                dataKey="intraYearDrawdown"
                fill={CHART_COLORS.red}
                radius={[0, 0, 3, 3]}
                maxBarSize={28}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Calendar year return
          </p>
          <ChartContainer config={returnChartConfig} className="aspect-auto h-[200px] w-full sm:h-[220px]">
            <BarChart data={rows} margin={{ ...MARGIN_LEFT, top: 8, bottom: 8, left: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={TICK_MD}
                height={36}
                interval={rows.length > 14 ? 1 : 0}
              >
                <Label {...xLabel('Year', -2)} />
              </XAxis>
              <YAxis
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={TICK_MD}
                tickFormatter={formatAxisPercentTick}
                width={44}
                type="number"
              >
                <Label {...yLabel('Return (%)')} />
              </YAxis>
              <ReferenceLine y={0} stroke={CHART_COLORS.muted} strokeWidth={1.5} />
              <ChartTooltip
                cursor={CHART_TOOLTIP_CURSOR}
                content={<ChartTooltipContent format="percent" />}
              />
              <Bar dataKey="returnPercent" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                {rows.map((row) => (
                  <Cell
                    key={row.year}
                    fill={signedReturnColor(row.returnPercent)}
                    fillOpacity={row.isPartialYear ? 0.55 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <aside className="flex flex-col justify-center gap-3 border-t border-border/70 bg-muted/30 p-5 text-sm lg:border-l lg:border-t-0 dark:border-slate-700/60 dark:bg-slate-900/40">
          <InsightCallout
            title="Temporary declines are common"
            body={`${stats.tenPlusDrawdownRate.toFixed(0)}% of years saw at least a 10% peak-to-trough fall within the year.`}
          />
          <InsightCallout
            title="Recovery often follows"
            body={`Despite those falls, ${stats.positiveYearRate.toFixed(0)}% of calendar years still closed in positive territory for this fund.`}
            tone="good"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Top chart: worst peak-to-trough fall inside each year. Bottom chart: full-year return from
            first to last NAV in that calendar year.
          </p>
        </aside>
      </div>

      <AnnualStressInfographicCard
        calendarYears={calendarYears}
        fundName={fundName}
        dataTo={dataTo}
      />
    </div>
  )
}

function StatPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'warn'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        tone === 'good' && 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30',
        tone === 'warn' && 'border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/25',
        tone === 'neutral' && 'border-slate-200 bg-white dark:border-slate-700 dark:bg-card',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function InsightCallout({
  title,
  body,
  tone = 'neutral',
}: {
  title: string
  body: string
  tone?: 'neutral' | 'good'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        tone === 'good'
          ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/40 dark:bg-emerald-950/30'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-card',
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}
