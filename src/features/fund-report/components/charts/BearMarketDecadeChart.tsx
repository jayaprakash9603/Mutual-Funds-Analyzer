import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Label, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import { CHART_COLORS } from '@/lib/charts/chartColors'
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
import { formatPercent } from '@/lib/utils'
import type { FundReport } from '../../schemas'

type Decades = FundReport['drawdown']['bearMarketDecades']

const chartConfig = {
  percentOfDays: { label: 'Time in bear market', color: CHART_COLORS.red },
}

type BearMarketDecadeChartProps = {
  decades: Decades
  fundName: string
}

export function BearMarketDecadeChart({ decades, fundName }: BearMarketDecadeChartProps) {
  const rows = useMemo(
    () =>
      decades.map((d) => ({
        ...d,
        label: d.partial ? `${d.decadeLabel}*` : d.decadeLabel,
      })),
    [decades],
  )

  const analysis = useMemo(() => {
    if (rows.length === 0) return null
    const sorted = [...rows].sort((a, b) => b.percentOfDays - a.percentOfDays)
    const worst = sorted[0]!
    const calmest = sorted[sorted.length - 1]!
    const totalBear = rows.reduce((sum, r) => sum + r.daysInBearMarket, 0)
    const totalDays = rows.reduce((sum, r) => sum + r.totalDays, 0)
    const overall = totalDays > 0 ? (totalBear / totalDays) * 100 : 0
    return { worst, calmest, overall }
  }, [rows])

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Need more than 10 years of history to show decade-wise bear market analysis.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {analysis && (
        <p className="rounded-xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-100">
          {fundName} spent {formatPercent(analysis.overall, 0)} of trading days more than 20% below
          its running peak. The toughest decade was {analysis.worst.label} at{' '}
          {formatPercent(analysis.worst.percentOfDays, 0)}; the calmest was {analysis.calmest.label}{' '}
          at {formatPercent(analysis.calmest.percentOfDays, 0)}.
        </p>
      )}

      <div className="w-full rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full sm:h-[280px]">
          <BarChart data={rows} margin={{ ...MARGIN_LEFT, top: 12, bottom: 0, left: 44 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD} height={44}>
              <Label {...xLabel('Decade', -2)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatAxisPercentTick}
              width={44}
              domain={[0, 'auto']}
            >
              <Label {...yLabel('% days below -20%')} />
            </YAxis>
            <ChartTooltip
              cursor={CHART_TOOLTIP_CURSOR}
              content={
                <ChartTooltipContent
                  format="percent"
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as (typeof rows)[number] | undefined
                    return row ? `${row.decadeLabel}${row.partial ? ' (partial)' : ''}` : ''
                  }}
                />
              }
            />
            <Bar
              dataKey="percentOfDays"
              fill={CHART_COLORS.red}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <p className="mt-2 text-xs text-muted-foreground">
          Bear market = more than 20% below the running peak. *Partial decade (incomplete data range).
        </p>
      </div>
    </div>
  )
}

export function hasDecadeHistory(dataFrom?: string, dataTo?: string) {
  if (!dataFrom || !dataTo) return false
  const from = new Date(dataFrom).getTime()
  const to = new Date(dataTo).getTime()
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return false
  const years = (to - from) / (365.25 * 24 * 60 * 60 * 1000)
  return years >= 10
}
