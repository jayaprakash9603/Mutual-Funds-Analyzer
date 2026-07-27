import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
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
  ZERO_LINE_STROKE,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { CHART_INSET_CLASS } from '@/lib/charts/chartSurface'
import { cn, formatPercent } from '@/lib/utils'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import type { FundReportPerformance } from '../../schemas'
import { ReportInsightCard } from '../layout/ReportInsightCard'

type Insights = FundReportPerformance['calendarYearInsights']
type YearRow = Insights['sortedReturns']['years'][number]

type ChartRow = YearRow & {
  label: string
}

type SortedCalendarReturnsChartProps = {
  sortedReturns: Insights['sortedReturns']
  fundName: string
}

const BAR_BLUE = CHART_COLORS.blue

function computeYDomain(rows: ChartRow[]): [number, number] {
  const maxReturn = Math.max(...rows.map((row) => row.returnPercent), 10)
  const minReturn = Math.min(...rows.map((row) => row.returnPercent), -10)
  const yMax = Math.ceil((maxReturn + 8) / 10) * 10
  const yMin = Math.floor((minReturn - 8) / 10) * 10
  return [Math.min(yMin, 0), Math.max(yMax, 10)]
}

function ReturnBarLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  rows,
}: LabelProps & { rows: ChartRow[] }) {
  const row = rows[index ?? 0]
  if (!row) return null

  const isNegative = row.returnPercent < 0
  const fill = row.inLongTermBand ? CHART_COLORS.fund : BAR_BLUE
  const cx = Number(x) + Number(width) / 2
  const barExtent = Math.abs(Number(height))
  const labelY = isNegative ? Number(y) + barExtent + 6 : Number(y) - 6

  return (
    <text
      x={cx}
      y={labelY}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={fill}
      fontSize={10}
      fontWeight={700}
      transform={`rotate(-90, ${cx}, ${labelY})`}
    >
      {formatPercent(row.returnPercent, 1)}
    </text>
  )
}

function SortedReturnTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartRow }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{row.year}</p>
      <p
        className={cn(
          'mt-1 tabular-nums font-medium',
          row.returnPercent < 0 ? 'text-red-600' : 'text-foreground',
        )}
      >
        {formatPercent(row.returnPercent, 1)} calendar-year return
      </p>
      {row.inLongTermBand ? (
        <p className="mt-1 text-emerald-700 dark:text-emerald-400">Within the long-term average band</p>
      ) : null}
    </div>
  )
}

function ChartLegend({
  bandLow,
  bandHigh,
}: {
  bandLow: number
  bandHigh: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="size-3 rounded-sm bg-[#3b82f6]" aria-hidden="true" />
        Annual return (%)
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="size-3 rounded-sm bg-emerald-600" aria-hidden="true" />
        Years between {formatPercent(bandLow, 0)} &amp; {formatPercent(bandHigh, 0)}
      </span>
    </div>
  )
}

export function SortedCalendarReturnsChart({
  sortedReturns,
  fundName,
}: SortedCalendarReturnsChartProps) {
  const rows = useMemo<ChartRow[]>(
    () =>
      sortedReturns.years.map((row) => ({
        ...row,
        label: String(row.year),
      })),
    [sortedReturns.years],
  )

  const yDomain = useMemo(() => computeYDomain(rows), [rows])
  const yearsInBand = rows.filter((row) => row.inLongTermBand).length
  const isSmall = useIsSmallScreen()
  const axis = useResponsiveAxis()

  if (rows.length === 0) {
    return null
  }

  const bandLow = formatPercent(sortedReturns.longTermBandLow, 0)
  const bandHigh = formatPercent(sortedReturns.longTermBandHigh, 0)

  return (
    <ReportInsightCard
      title={
        <>
          Calendar year returns are volatile &amp; rarely resemble long-term averages{' '}
          <span className="text-emerald-700 dark:text-emerald-400">
            ({bandLow} – {bandHigh})
          </span>
        </>
      }
      subtitle={`${fundName} (${sortedReturns.periodLabel}) — calendar years sorted highest to lowest`}
      footer={`Annual returns ranked highest to lowest. Green bars mark calendar years whose return fell between ${bandLow} and ${bandHigh}.`}
    >
      <ChartLegend
        bandLow={sortedReturns.longTermBandLow}
        bandHigh={sortedReturns.longTermBandHigh}
      />

      <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center sm:px-4 sm:py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {fundName.split(' - ')[0] ?? fundName}
        </p>
        <p className="mt-1 text-base font-bold tabular-nums text-foreground sm:text-lg">
          {formatPercent(sortedReturns.cagrPercent, 1)} CAGR i.e.{' '}
          {Math.round(sortedReturns.moneyMultiple)} times in {rows.length}{' '}
          {rows.length === 1 ? 'year' : 'years'}
        </p>
      </div>

      {sortedReturns.headline ? (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          {sortedReturns.headline}
        </p>
      ) : (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          Only {yearsInBand} of {rows.length} calendar years landed inside the {bandLow}–{bandHigh}{' '}
          long-term band — most years finish well above or below that range.
        </p>
      )}

      <div className={cn('relative overflow-hidden', CHART_INSET_CLASS)}>
        <div
          className="pointer-events-none absolute inset-x-[12%] top-[14%] bottom-[18%] rotate-45 rounded-lg bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10"
          aria-hidden="true"
        />

        <ChartContainer
          config={{ returnPercent: { label: 'Annual return', color: BAR_BLUE } }}
          className="relative aspect-auto h-[360px] w-full sm:h-[420px]"
        >
          <BarChart
            data={rows}
            margin={{ ...MARGIN_LEFT, top: 44, right: 12, bottom: 8 }}
            barCategoryGap="22%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={{ ...axis.tick, fontWeight: 600 }}
              interval={isSmall ? 'preserveStartEnd' : 0}
              angle={isSmall ? axis.xAngle : -90}
              textAnchor={isSmall ? axis.xAnchor : 'end'}
              height={isSmall ? axis.xHeight : 72}
            />
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatAxisPercentTick}
              width={44}
              domain={yDomain}
              tickCount={Math.min(8, Math.floor((yDomain[1] - yDomain[0]) / 10) + 1)}
            >
              <Label {...yLabel('Annual return (%)')} />
            </YAxis>
            <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} strokeWidth={1.5} />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<SortedReturnTooltip />} />
            <Bar dataKey="returnPercent" maxBarSize={48}>
              {rows.map((row) => (
                <Cell
                  key={row.year}
                  fill={row.inLongTermBand ? CHART_COLORS.fund : BAR_BLUE}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
              {!isSmall ? (
                <LabelList content={(props) => <ReturnBarLabel {...props} rows={rows} />} />
              ) : null}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </ReportInsightCard>
  )
}
