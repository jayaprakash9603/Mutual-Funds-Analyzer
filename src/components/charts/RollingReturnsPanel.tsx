import { useCallback, useMemo } from 'react'
import {
  CartesianGrid,
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
import { downsample } from '@/lib/utils'

const FUND_COLOR = '#16a34a'
const BENCHMARK_COLOR = '#ea580c'

const chartConfig = {
  fund: { label: 'Fund', color: FUND_COLOR },
  benchmark: { label: 'Benchmark', color: BENCHMARK_COLOR },
} satisfies ChartConfig

/**
 * Recharts v3 re-dispatches chart state whenever a prop identity changes, so
 * every object-valued prop must be a stable reference or the chart re-renders
 * until React throws "Maximum update depth exceeded".
 */
const CHART_MARGIN = { top: 16, right: 24, left: 8, bottom: 8 }
const AXIS_TICK = { fontSize: 11, fill: '#94a3b8' }
const TOOLTIP_CURSOR = { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }
const FUND_ACTIVE_DOT = { r: 6, fill: FUND_COLOR, stroke: '#fff', strokeWidth: 2 }
const BENCHMARK_ACTIVE_DOT = { r: 6, fill: BENCHMARK_COLOR, stroke: '#fff', strokeWidth: 2 }
const Y_DOMAIN: ['auto', 'auto'] = ['auto', 'auto']

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

  const fundValue = point.fund
  const benchValue = point.benchmark

  return (
    <div className="relative min-w-[280px] rounded-md border-2 border-[#16a34a] bg-background px-4 py-3 text-sm shadow-lg">
      <div className="absolute -left-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-[#16a34a]" />
      <p className="mb-2 text-sm font-medium text-foreground">{point.tooltipRange}</p>
      <p className="leading-relaxed">
        <span className="font-medium" style={{ color: FUND_COLOR }}>
          {fundName}:
        </span>{' '}
        <span className="font-bold text-foreground">{fundValue.toFixed(2)}%</span>
      </p>
      <p className="leading-relaxed">
        <span className="font-medium" style={{ color: BENCHMARK_COLOR }}>
          {benchmarkName}:
        </span>{' '}
        <span className="font-bold text-foreground">{benchValue.toFixed(2)}%</span>
      </p>
    </div>
  )
}

function formatStat(value: number) {
  return value.toFixed(2)
}

function formatPct(value: number) {
  return `${value.toFixed(2)}%`
}

export function RollingReturnsPanel({
  input,
  fundName,
  benchmarkName,
}: RollingReturnsPanelProps) {
  const analysis = useMemo(() => getDetailedRollingReturnData(input), [input])

  const chartData = useMemo(() => {
    const sampled = downsample(analysis.points, 400)
    return sampled.map((p, i) => ({ ...p, index: i }))
  }, [analysis.points])

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

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
      <div className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <h2 className="text-xl font-semibold tracking-tight">Rolling Returns</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {period} rolling return comparison — hover chart for details
        </p>
      </div>

      <div className="px-4 py-6 sm:px-6">
        <ChartContainer config={chartConfig} className="h-[420px] w-full aspect-auto">
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={48}
              tick={AXIS_TICK}
              angle={-20}
              textAnchor="end"
              height={70}
            />
            <YAxis
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={formatAxisPercent}
              domain={Y_DOMAIN}
            />
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
                className="sticky left-0 z-10 min-w-[220px] bg-[#1a8354] text-left text-white"
              >
                Scheme / Category Name
              </TableHead>
              <TableHead colSpan={4} className="bg-[#1a8354] text-white">
                Key Parameters
              </TableHead>
              <TableHead colSpan={CONSISTENCY_BUCKETS.length} className="bg-[#1a8354] text-white">
                Return Consistency (% of times)
              </TableHead>
            </TableRow>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="bg-[#1a8354]/90 text-white">Average</TableHead>
              <TableHead className="bg-[#1a8354]/90 text-white">Median</TableHead>
              <TableHead className="bg-[#1a8354]/90 text-white">Maximum</TableHead>
              <TableHead className="bg-[#1a8354]/90 text-white">Minimum</TableHead>
              {CONSISTENCY_BUCKETS.map((b) => (
                <TableHead key={b.label} className="bg-[#1a8354]/90 text-white text-[11px]">
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
                  <TableCell key={bucket.label}>{formatPct(bucket.percentage)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
