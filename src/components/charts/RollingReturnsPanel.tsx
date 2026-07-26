import { useCallback, useMemo } from 'react'
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getDetailedRollingReturnData,
  CONSISTENCY_BUCKETS,
  type RollingReturnChartPoint,
} from '@/lib/analytics/rollingReturnsAnalysis'
import type { AnalysisInput } from '@/lib/analytics/types'
import { downsample, formatPercent } from '@/lib/utils'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import {
  AXIS_LINE,
  TICK_LINE,
  TICK_MD,
  TICK_SM,
  yLabelRight,
  xLabel,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS, TABLE_HEAD_CLASS, TABLE_SUBHEAD_CLASS } from '@/lib/charts/chartColors'

const FUND_COLOR = CHART_COLORS.fund
const BENCHMARK_COLOR = CHART_COLORS.benchmark
const KEY_PARAMETER_COLUMNS = 4

const chartConfig = {
  fund: { label: 'Fund', color: FUND_COLOR },
  benchmark: { label: 'Benchmark', color: BENCHMARK_COLOR },
} satisfies ChartConfig

const CHART_MARGIN = { top: 16, right: 24, left: 8, bottom: 8 }
const TOOLTIP_CURSOR = { stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }
const FUND_ACTIVE_DOT = { r: 6, fill: FUND_COLOR, stroke: '#fff', strokeWidth: 2 }
const BENCHMARK_ACTIVE_DOT = { r: 6, fill: BENCHMARK_COLOR, stroke: '#fff', strokeWidth: 2 }
const Y_DOMAIN: ['auto', 'auto'] = ['auto', 'auto']
const CHART_HEIGHT_CLASS = 'aspect-auto h-[320px] w-full sm:h-[400px] lg:h-[460px]'

const formatAxisPercent = (value: number) => `${value}%`

interface RollingReturnsPanelProps {
  input: AnalysisInput
  fundName: string
  benchmarkName: string
}

function RollingReturnTooltip({
  active,
  payload,
  fundName,
  benchmarkName,
}: {
  active?: boolean
  payload?: ReadonlyArray<{
    payload?: RollingReturnChartPoint
    dataKey?: string
    value?: number
    color?: string
  }>
  fundName: string
  benchmarkName: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div
      className="relative min-w-[280px] rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-md"
      style={{ borderColor: FUND_COLOR }}
    >
      <div
        className="absolute -left-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent"
        style={{ borderRightColor: FUND_COLOR }}
      />
      <p className="mb-2 text-sm font-medium text-foreground">{point.tooltipRange}</p>
      <p className="leading-relaxed">
        <span className="font-medium" style={{ color: FUND_COLOR }}>
          {fundName}:
        </span>{' '}
        <span
          className={`font-bold tabular-nums ${point.fund < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
        >
          {point.fund.toFixed(2)}%
        </span>
      </p>
      <p className="leading-relaxed">
        <span className="font-medium" style={{ color: BENCHMARK_COLOR }}>
          {benchmarkName}:
        </span>{' '}
        <span
          className={`font-bold tabular-nums ${point.benchmark < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
        >
          {point.benchmark.toFixed(2)}%
        </span>
      </p>
    </div>
  )
}

function formatStat(value: number) {
  return value.toFixed(2)
}

export function RollingReturnsPanel({
  input,
  fundName,
  benchmarkName,
}: RollingReturnsPanelProps) {
  const analysis = useMemo(() => getDetailedRollingReturnData(input), [input])

  const chartData = useMemo(
    () => downsample(analysis.points).map((p, i) => ({ ...p, index: i })),
    [analysis.points],
  )

  if (!chartData.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
        No rolling return data available for this fund
      </div>
    )
  }

  const displayFundName = fundName || analysis.tableRows[0]?.name || 'Fund'
  const displayBenchName =
    analysis.tableRows[1]?.category || benchmarkName || analysis.tableRows[1]?.name || 'Benchmark'

  return (
    <RollingReturnsChart
      analysis={analysis}
      chartData={chartData}
      displayFundName={displayFundName}
      displayBenchName={displayBenchName}
      period={input.period}
    />
  )
}

function RollingReturnsChart({
  analysis,
  chartData,
  displayFundName,
  displayBenchName,
  period,
}: {
  analysis: ReturnType<typeof getDetailedRollingReturnData>
  chartData: Array<RollingReturnChartPoint & { index: number }>
  displayFundName: string
  displayBenchName: string
  period: string
}) {
  const isSmall = useIsSmallScreen()

  const tooltipContent = useMemo(
    () => <RollingReturnTooltip fundName={displayFundName} benchmarkName={displayBenchName} />,
    [displayFundName, displayBenchName],
  )

  const legendFormatter = useCallback(
    (value: string) => (
      <span className="text-sm text-muted-foreground">
        {value === 'fund' ? displayFundName : displayBenchName}
      </span>
    ),
    [displayFundName, displayBenchName],
  )

  const xTick = isSmall ? TICK_SM : TICK_MD
  const xHeight = isSmall ? 48 : 70
  const xAngle = isSmall ? 0 : -20
  const xAnchor = isSmall ? 'middle' : 'end'
  const xGap = isSmall ? 72 : 48

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
      <div className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <h2 className="text-xl font-semibold tracking-tight">Rolling Returns</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {period} rolling return comparison — hover chart for details
        </p>
      </div>

      <div className="px-4 py-6 sm:px-6">
        <ChartContainer config={chartConfig} className={CHART_HEIGHT_CLASS}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              interval="preserveStartEnd"
              minTickGap={xGap}
              tick={xTick}
              angle={xAngle}
              textAnchor={xAnchor}
              height={xHeight}
            >
              <Label {...xLabel('Rolling window', isSmall ? -2 : -6)} />
            </XAxis>
            <YAxis
              orientation="right"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={xTick}
              tickFormatter={formatAxisPercent}
              domain={Y_DOMAIN}
              width={isSmall ? 40 : 52}
            >
              <Label {...yLabelRight('Return (%)')} />
            </YAxis>
            <Tooltip content={tooltipContent} cursor={TOOLTIP_CURSOR} />
            <Legend verticalAlign="bottom" height={48} formatter={legendFormatter} />
            <Line
              type="monotone"
              dataKey="fund"
              name="fund"
              stroke={FUND_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={FUND_ACTIVE_DOT}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="benchmark"
              stroke={BENCHMARK_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={BENCHMARK_ACTIVE_DOT}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="overflow-x-auto border-t border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead
                rowSpan={2}
                className={`sticky left-0 z-10 min-w-[220px] text-left ${TABLE_HEAD_CLASS}`}
              >
                Scheme / Category Name
              </TableHead>
              <TableHead colSpan={KEY_PARAMETER_COLUMNS} className={TABLE_HEAD_CLASS}>
                Key Parameters
              </TableHead>
              <TableHead colSpan={CONSISTENCY_BUCKETS.length} className={TABLE_HEAD_CLASS}>
                Return Consistency (% of times)
              </TableHead>
            </TableRow>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className={TABLE_SUBHEAD_CLASS}>Average</TableHead>
              <TableHead className={TABLE_SUBHEAD_CLASS}>Median</TableHead>
              <TableHead className={TABLE_SUBHEAD_CLASS}>Maximum</TableHead>
              <TableHead className={TABLE_SUBHEAD_CLASS}>Minimum</TableHead>
              {CONSISTENCY_BUCKETS.map((b) => (
                <TableHead key={b.label} className={`${TABLE_SUBHEAD_CLASS} text-[11px]`}>
                  {b.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.tableRows.map((row, i) => (
              <TableRow key={row.name} className={i % 2 === 0 ? 'bg-background/60' : 'bg-muted/10'}>
                <TableCell className="sticky left-0 z-10 min-w-[220px] bg-inherit text-left font-medium">
                  <div>{row.name}</div>
                  {row.category && (
                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">{row.category}</div>
                  )}
                </TableCell>
                <TableCell>{formatStat(row.stats.average)}</TableCell>
                <TableCell>{formatStat(row.stats.median)}</TableCell>
                <TableCell>{formatStat(row.stats.maximum)}</TableCell>
                <TableCell>{formatStat(row.stats.minimum)}</TableCell>
                {row.consistency.map((bucket) => (
                  <TableCell key={bucket.label}>{formatPercent(bucket.percentage)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
