import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Label, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import { CHART_INSET_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  formatAxisPercentTick,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { formatPercent } from '@/lib/utils'
import type { FundReport } from '../../schemas'

type Decades = FundReport['drawdown']['bearMarketDecades']

const chartConfig = {
  percentOfDays: { label: 'Time in bear market', color: CHART_COLORS.red },
}

function decadeAxisPadding(count: number): { left: number; right: number } {
  if (count <= 1) return { left: 0.45, right: 0.45 }
  if (count <= 2) return { left: 0.35, right: 0.35 }
  if (count <= 4) return { left: 0.12, right: 0.12 }
  return { left: 0.04, right: 0.04 }
}

type BearMarketDecadeChartProps = {
  decades: Decades
  fundName: string
}

export function BearMarketDecadeChart({ decades, fundName }: BearMarketDecadeChartProps) {
  const axis = useResponsiveAxis()
  const rows = useMemo(
    () =>
      decades
        .filter((d) => d.totalDays > 0)
        .map((d) => ({
          ...d,
          label: d.partial ? `${d.decadeLabel}*` : d.decadeLabel,
        })),
    [decades],
  )

  const axisPadding = useMemo(() => decadeAxisPadding(rows.length), [rows.length])

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
        <p className="rounded-lg border border-sky-200/70 bg-sky-50/80 px-3 py-2.5 text-sm leading-relaxed text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-100 sm:px-4 sm:py-3">
          {fundName} spent {formatPercent(analysis.overall, 0)} of trading days more than 20% below
          its running peak. The toughest decade was {analysis.worst.label} at{' '}
          {formatPercent(analysis.worst.percentOfDays, 0)}; the calmest was {analysis.calmest.label}{' '}
          at {formatPercent(analysis.calmest.percentOfDays, 0)}.
        </p>
      )}

      <div className={CHART_INSET_CLASS}>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] w-full sm:h-[280px]"
        >
          <BarChart
            data={rows}
            margin={chartPlotMargin({ top: 12, bottom: 0 })}
            barCategoryGap={rows.length <= 3 ? '20%' : '18%'}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              height={axis.xHeight}
              interval={0}
              padding={axisPadding}
            >
              <Label {...xLabel('Decade', -2)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={formatAxisPercentTick}
              width={axis.yWidth}
              domain={[0, 'auto']}
            >
              {axis.showYLabel ? <Label {...yLabel('% days below -20%')} /> : null}
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
