import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Label, XAxis, YAxis } from 'recharts'
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
import { formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'

type BestDays = FundReportRisk['bestDays']

function formatIndianPortfolioValue(value: number): string {
  if (value >= 1_00_00_000) {
    const crore = value / 1_00_00_000
    return `₹${crore >= 10 ? crore.toFixed(0) : crore.toFixed(2)} crore`
  }
  if (value >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(0)} lakh`
  }
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function shortScenarioLabel(label: string): string {
  return label.replace(' best days', '').replace('Entire period', 'Full period')
}

type MissingBestDaysChartProps = {
  bestDays: BestDays
  fundName: string
}

export function MissingBestDaysChart({ bestDays, fundName }: MissingBestDaysChartProps) {
  const isSmall = useIsSmallScreen()
  const chartRows = useMemo(
    () =>
      bestDays.missingScenarios.map((row) => ({
        ...row,
        shortLabel: shortScenarioLabel(row.label),
        barColor:
          row.missCount === 0
            ? CHART_COLORS.fund
            : row.missCount >= 50
              ? CHART_COLORS.red
              : CHART_COLORS.blue,
      })),
    [bestDays.missingScenarios],
  )

  if (chartRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Need at least 30 trading days of NAV history to analyze best-day impact for {fundName}.
      </p>
    )
  }

  const principalLakh = bestDays.initialInvestment / 1_00_000

  return (
    <ReportInsightCard
      title="Returns are non-linear — missing a few best days significantly reduces outcomes"
      subtitle={`₹${principalLakh.toFixed(0)} lakh invested in ${fundName} (${bestDays.periodLabel})`}
      footer={bestDays.headlineSummary ?? undefined}
    >
      <div className={`relative w-full ${CHART_INSET_CLASS}`}>
        <ChartContainer
          config={{ finalValue: { label: 'Final value', color: CHART_COLORS.blue } }}
          className="aspect-auto h-[320px] w-full sm:h-[380px]"
        >
          <BarChart data={chartRows} margin={{ ...MARGIN_LEFT, top: 56, right: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="shortLabel"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              interval={0}
              angle={-24}
              textAnchor="end"
              height={72}
            >
              <Label {...xLabel('Scenario', -4)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={(v) => formatIndianPortfolioValue(Number(v))}
              width={72}
            >
              <Label {...yLabel('Portfolio value')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="finalValue" radius={[4, 4, 0, 0]}>
              {chartRows.map((row) => (
                <Cell key={row.label} fill={row.barColor} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {!isSmall ? (
          <div className="pointer-events-none absolute inset-x-4 top-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {chartRows.map((row) => (
              <div key={row.label} className="text-center text-[10px] leading-tight sm:text-xs">
                <div className="font-medium tabular-nums">
                  {formatIndianPortfolioValue(row.finalValue)} ({formatPercent(row.cagrPercent, 1)})
                </div>
                {row.lowerByPercent > 0 ? (
                  <div className="text-destructive">Lower by {formatPercent(row.lowerByPercent, 0)}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {isSmall ? (
          <ul className="mt-4 grid grid-cols-1 gap-2 border-t border-border/70 pt-4 text-xs dark:border-slate-700/60">
            {chartRows.map((row) => (
              <li key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">{row.shortLabel}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatIndianPortfolioValue(row.finalValue)} ({formatPercent(row.cagrPercent, 1)})
                  {row.lowerByPercent > 0 ? (
                    <span className="ml-2 text-destructive">
                      Lower by {formatPercent(row.lowerByPercent, 0)}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {bestDays.proximityInsight.bestDaysNearWorst > 0 ? (
          <aside className="mt-4 max-w-md rounded-lg border border-border/70 bg-muted/50 p-4 text-sm leading-relaxed dark:border-slate-700/60 dark:bg-slate-900/60 sm:ml-auto">
            <p>
              {bestDays.proximityInsight.bestDaysNearWorst} of the top{' '}
              {bestDays.proximityInsight.topRankLimit} days occurred within two weeks of the worst{' '}
              {bestDays.proximityInsight.worstDaysConsidered} days.
            </p>
            {bestDays.proximityInsight.exampleText ? (
              <p className="mt-2 text-muted-foreground">{bestDays.proximityInsight.exampleText}</p>
            ) : null}
          </aside>
        ) : null}
      </div>
    </ReportInsightCard>
  )
}
