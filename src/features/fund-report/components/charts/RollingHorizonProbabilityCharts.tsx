import { useMemo, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Customized, Label, LabelList, XAxis, YAxis } from 'recharts'
import type { LabelProps } from 'recharts'
import { ChartContainer, ChartTooltip, CHART_TOOLTIP_CURSOR } from '@/components/ui/chart'
import {
  AXIS_LINE,
  formatAxisPercentTick,
  GRID_STROKE,
  MARGIN_LEFT,
  TICK_LINE,
  TICK_MD,
  yLabel,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { formatPercent } from '@/lib/utils'
import type { FundReportPerformance } from '../../schemas'
import {
  buildHorizonProbabilityRows,
  formatHorizonProbability,
  HIGHLIGHT_HORIZON_LABEL,
  NEAR_ZERO_NEGATIVE_THRESHOLD,
  nearZeroTailSpan,
  type HorizonProbabilityMetric,
  type HorizonProbabilityRow,
} from '../../lib/rollingHorizonProbability'
import { ReportInsightCard } from '../layout/ReportInsightCard'

type RollingReturns = FundReportPerformance['rollingReturns']

type RollingHorizonProbabilityChartsProps = {
  rollingReturns: RollingReturns
  fundName: string
}

const BAR_BLUE = CHART_COLORS.blue
const NEAR_ZERO_STROKE = 'rgb(16 185 129)'

type AxisScale = {
  scale?: (value: number | string) => number
  bandWidth?: number
}

function ValueBarLabel({
  x = 0,
  y = 0,
  width = 0,
  index = 0,
  rows,
}: LabelProps & { rows: HorizonProbabilityRow[] }) {
  const row = rows[index ?? 0]
  if (!row) return null

  const fill = row.isNearZero ? CHART_COLORS.fund : row.highlight ? CHART_COLORS.fund : BAR_BLUE
  const cx = Number(x) + Number(width) / 2
  const labelY = row.value <= 0 ? Number(y) - 10 : Number(y) - 8

  return (
    <text
      x={cx}
      y={labelY}
      textAnchor="middle"
      fill={fill}
      fontSize={12}
      fontWeight={700}
    >
      {formatHorizonProbability(row.value)}
    </text>
  )
}

function HorizonTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: HorizonProbabilityRow }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{row.periodLabel}</p>
      <p className="mt-1 tabular-nums text-muted-foreground">
        {formatPercent(row.value, row.value < 1 ? 1 : 0)} across {row.count.toLocaleString()} rolling
        windows
      </p>
    </div>
  )
}

function NearZeroTailHighlight({
  rows,
  yMax,
  xAxisMap,
  yAxisMap,
}: {
  rows: HorizonProbabilityRow[]
  yMax: number
  xAxisMap?: Record<string, AxisScale>
  yAxisMap?: Record<string, AxisScale>
}) {
  const span = nearZeroTailSpan(rows)
  if (!span) return null

  const xAxis = Object.values(xAxisMap ?? {})[0]
  const yAxis = Object.values(yAxisMap ?? {})[0]
  if (!xAxis?.scale || !yAxis?.scale) return null

  const bandWidth = xAxis.bandWidth ?? 48
  const scaleX = xAxis.scale as (value: string) => number
  const scaleY = yAxis.scale as (value: number) => number

  const startRow = rows[span.start]
  const endRow = rows[span.end]
  if (!startRow || !endRow) return null

  const padX = 10
  const xLeft = scaleX(startRow.shortLabel) - bandWidth / 2 - padX
  const xRight = scaleX(endRow.shortLabel) + bandWidth / 2 + padX
  const yBottom = scaleY(0) + 10
  const yTop = scaleY(yMax) - 12

  return (
    <rect
      x={xLeft}
      y={yTop}
      width={xRight - xLeft}
      height={Math.max(yBottom - yTop, 40)}
      fill="rgb(16 185 129 / 0.04)"
      stroke={NEAR_ZERO_STROKE}
      strokeWidth={2}
      strokeDasharray="7 5"
      rx={14}
      ry={14}
    />
  )
}

function HorizonProbabilityCard({
  title,
  subtitle,
  rows,
  metric,
}: {
  title: ReactNode
  subtitle: string
  rows: HorizonProbabilityRow[]
  metric: HorizonProbabilityMetric
}) {
  if (rows.length === 0) {
    return null
  }

  const maxY = Math.max(...rows.map((row) => row.value), 5)
  const yDomainMax = Math.ceil(maxY * 1.12)
  const windowCount = rows.reduce((max, row) => Math.max(max, row.count), 0)
  const categoryCount = rows.length

  const highlightOverlay = useMemo(() => {
    if (metric !== 'percentNegative' || !nearZeroTailSpan(rows)) {
      return undefined
    }

    const chartRows = rows
    const domainMax = yDomainMax
    return function NearZeroOverlay(props: Record<string, unknown>) {
      return (
        <NearZeroTailHighlight
          rows={chartRows}
          yMax={domainMax}
          xAxisMap={props.xAxisMap as Record<string, AxisScale> | undefined}
          yAxisMap={props.yAxisMap as Record<string, AxisScale> | undefined}
        />
      )
    }
  }, [metric, rows, yDomainMax])

  return (
    <ReportInsightCard
      title={title}
      subtitle={subtitle}
      footer={`Based on ${windowCount.toLocaleString()} rolling windows per horizon where NAV history allows.`}
    >
      <div className={CHART_PANEL_CLASS}>
        <ChartContainer
          config={{ value: { label: '% of windows', color: BAR_BLUE } }}
          className="aspect-auto h-[280px] w-full sm:h-[320px]"
        >
          <BarChart
            data={rows}
            margin={{ ...MARGIN_LEFT, top: 40, right: 16, bottom: 8 }}
            barCategoryGap={categoryCount > 6 ? '12%' : '18%'}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="shortLabel"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={{ ...TICK_MD, fontSize: 11, fontWeight: 600 }}
              interval={0}
            />
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatAxisPercentTick}
              width={44}
              domain={[0, yDomainMax]}
            >
              <Label {...yLabel('% of windows')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<HorizonTooltip />} />
            {highlightOverlay ? <Customized component={highlightOverlay} /> : null}
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56} minPointSize={2}>
              {rows.map((row) => (
                <Cell
                  key={row.periodLabel}
                  fill={row.highlight ? CHART_COLORS.fund : BAR_BLUE}
                />
              ))}
              <LabelList content={(props) => <ValueBarLabel {...props} rows={rows} />} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </ReportInsightCard>
  )
}

function HighlightTitle({
  lead,
  highlight,
}: {
  lead: string
  highlight: string
}) {
  return (
    <>
      {lead}{' '}
      <span className="text-emerald-700 dark:text-emerald-400">{highlight}</span>
    </>
  )
}

export function RollingHorizonProbabilityCharts({
  rollingReturns,
  fundName,
}: RollingHorizonProbabilityChartsProps) {
  const negativeRows = useMemo(
    () =>
      buildHorizonProbabilityRows(rollingReturns.periods, 'percentNegative', {
        markNearZero: true,
        nearZeroThreshold: NEAR_ZERO_NEGATIVE_THRESHOLD,
      }),
    [rollingReturns.periods],
  )

  const above7Rows = useMemo(
    () =>
      buildHorizonProbabilityRows(rollingReturns.periods, 'percentAbove7', {
        highlightPeriod: HIGHLIGHT_HORIZON_LABEL,
      }),
    [rollingReturns.periods],
  )

  const above10Rows = useMemo(
    () =>
      buildHorizonProbabilityRows(rollingReturns.periods, 'percentAbove10', {
        highlightPeriod: HIGHLIGHT_HORIZON_LABEL,
      }),
    [rollingReturns.periods],
  )

  const cards = [
    negativeRows.length > 0 ? (
      <HorizonProbabilityCard
        key="negative"
        title={
          <HighlightTitle
            lead="Longer the time frame,"
            highlight="lower the odds of negative returns"
          />
        }
        subtitle={`${fundName} — % instances of negative rolling returns since inception`}
        rows={negativeRows}
        metric="percentNegative"
      />
    ) : null,
    above7Rows.length > 0 ? (
      <HorizonProbabilityCard
        key="above7"
        title="Returns above 7%"
        subtitle={`${fundName} — % instances of rolling returns above 7% since inception`}
        rows={above7Rows}
        metric="percentAbove7"
      />
    ) : null,
    above10Rows.length > 0 ? (
      <HorizonProbabilityCard
        key="above10"
        title="Returns above 10%"
        subtitle={`${fundName} — % instances of rolling returns above 10% since inception`}
        rows={above10Rows}
        metric="percentAbove10"
      />
    ) : null,
  ].filter(Boolean)

  if (cards.length === 0) {
    return null
  }

  return <div className="space-y-8">{cards}</div>
}
