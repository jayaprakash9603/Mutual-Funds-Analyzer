import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { CHART_HEADER_CLASS, CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import {
  CHART_TOOLTIP_CURSOR,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import {
  getDetailedRollingReturnData,
  type RollingReturnChartPoint,
} from '@/lib/analytics/rollingReturnsAnalysis'
import { DEFAULT_PERIOD, PERIODS, type Period } from '@/lib/constants'
import { cn, downsample } from '@/lib/utils'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabelRight,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { formatIndexedNavTick } from '../../lib/drawdown/declineRecoveryCycles'
import type { FundReportRisk } from '../../schemas'

const FUND_COLOR = CHART_COLORS.fund
const BENCHMARK_COLOR = CHART_COLORS.benchmark

const rollingConfig = {
  fund: { label: 'Fund', color: FUND_COLOR },
  benchmark: { label: 'Benchmark', color: BENCHMARK_COLOR },
} satisfies ChartConfig

const absoluteConfig = {
  indexValue: { label: 'Indexed NAV', color: FUND_COLOR },
} satisfies ChartConfig

const ROLLING_CHART_MARGIN = { top: 16, right: 56, left: 8, bottom: 12 }
const TOOLTIP_CURSOR = { stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }
const Y_DOMAIN: ['auto', 'auto'] = ['auto', 'auto']
const CHART_HEIGHT_CLASS = 'aspect-auto h-[300px] w-full sm:h-[360px] lg:h-[400px]'

function periodYears(period: Period): number {
  const match = period.match(/^(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 5
}

function filterIndexedNavByPeriod(
  points: FundReportRisk['drawdown']['indexedNav'],
  period: Period,
) {
  if (points.length === 0) return points
  const years = periodYears(period)
  const lastDate = new Date(points[points.length - 1]!.date)
  const cutoff = new Date(lastDate)
  cutoff.setFullYear(cutoff.getFullYear() - years)
  const cutoffIso = cutoff.toISOString().slice(0, 10)
  const window = points.filter((point) => point.date >= cutoffIso)
  if (window.length === 0) return window
  const base = window[0]!.indexValue
  return window.map((point) => ({
    date: point.date,
    indexValue: base <= 0 ? 100 : (point.indexValue / base) * 100,
  }))
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
  }>
  fundName: string
  benchmarkName: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div
      className="relative min-w-[260px] rounded-lg border border-border bg-popover px-4 py-3 text-sm shadow-md"
      style={{ borderColor: FUND_COLOR }}
    >
      <p className="mb-2 text-sm font-medium text-foreground">{point.tooltipRange}</p>
      <p className="leading-relaxed">
        <span className="font-medium" style={{ color: FUND_COLOR }}>
          {fundName}:
        </span>{' '}
        <span className="font-bold tabular-nums">{point.fund.toFixed(2)}%</span>
      </p>
      <p className="leading-relaxed">
        <span className="font-medium" style={{ color: BENCHMARK_COLOR }}>
          {benchmarkName}:
        </span>{' '}
        <span className="font-bold tabular-nums">{point.benchmark.toFixed(2)}%</span>
      </p>
    </div>
  )
}

type FundReportReturnsChartProps = {
  scheme: string
  fundName: string
  benchmarkName: string
  indexedNav?: FundReportRisk['drawdown']['indexedNav']
  indexedNavLoading?: boolean
  /** Shared snapshot / offline view — uses indexed NAV only, no analysis API. */
  offlineView?: boolean
}

export function FundReportReturnsChart({
  scheme,
  fundName,
  benchmarkName,
  indexedNav = [],
  indexedNavLoading = false,
  offlineView = false,
}: FundReportReturnsChartProps) {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)
  const [mode, setMode] = useState<'rolling' | 'absolute'>(offlineView ? 'absolute' : 'rolling')
  const axis = useResponsiveAxis()

  const { data: analysisData, loading: analysisLoading } = useFundAnalysis(
    !offlineView && mode === 'rolling' ? scheme : null,
    period,
  )

  const rollingChartData = useMemo(() => {
    if (!analysisData) return []
    const analysis = getDetailedRollingReturnData({
      fund: analysisData.fund,
      benchmark: analysisData.benchmark,
      period,
    })
    return downsample(analysis.points).map((point, index) => ({ ...point, index }))
  }, [analysisData, period])

  const absoluteChartData = useMemo(
    () => filterIndexedNavByPeriod(indexedNav, period),
    [indexedNav, period],
  )

  const rollingTickInterval = useMemo(() => {
    const count = rollingChartData.length
    if (count <= 8) return 0
    return Math.max(1, Math.floor(count / 8))
  }, [rollingChartData.length])

  const periodControl = (
    <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
      <SelectTrigger className="w-[140px]" aria-label="Rolling window">
        <SelectValue placeholder="Period" />
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
      <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', CHART_HEADER_CLASS)}>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Returns comparison</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fund vs benchmark — switch window and return type below
          </p>
        </div>
        {periodControl}
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as 'rolling' | 'absolute')}>
        <div className="border-b border-border/60 px-4 sm:px-6">
          <TabsList scrollable className="h-10 bg-transparent p-0">
            <TabsTrigger value="rolling" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent">
              Rolling returns
            </TabsTrigger>
            <TabsTrigger value="absolute" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent">
              Absolute returns
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rolling" className="m-0 px-4 py-6 sm:px-6">
          {offlineView ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Rolling returns are not included in shared snapshots. Switch to absolute returns.
            </p>
          ) : analysisLoading && rollingChartData.length === 0 ? (
            <Skeleton className={CHART_HEIGHT_CLASS} />
          ) : rollingChartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No rolling return data for {period}
            </p>
          ) : (
            <div className={CHART_PANEL_CLASS}>
            <ChartContainer config={rollingConfig} className={CHART_HEIGHT_CLASS}>
              <LineChart data={rollingChartData} margin={ROLLING_CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis
                  dataKey="shortLabel"
                  tickLine={TICK_LINE}
                  axisLine={AXIS_LINE}
                  interval={rollingTickInterval}
                  minTickGap={axis.xGap}
                  tick={axis.tick}
                  angle={axis.xAngle}
                  textAnchor={axis.xAnchor}
                  height={axis.xHeight}
                >
                  <Label {...xLabel('Window end date', axis.xAngle === 0 ? -2 : -4)} />
                </XAxis>
                <YAxis
                  orientation="right"
                  tickLine={TICK_LINE}
                  axisLine={AXIS_LINE}
                  tick={axis.tick}
                  tickFormatter={(value) => `${value}%`}
                  domain={Y_DOMAIN}
                  width={axis.yWidth}
                >
                  <Label {...yLabelRight('Return (%)')} />
                </YAxis>
                <Tooltip
                  content={
                    <RollingReturnTooltip fundName={fundName} benchmarkName={benchmarkName} />
                  }
                  cursor={TOOLTIP_CURSOR}
                />
                <Line
                  type="monotone"
                  dataKey="fund"
                  name="fund"
                  stroke={FUND_COLOR}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="benchmark"
                  stroke={BENCHMARK_COLOR}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/70 pt-3 text-sm dark:border-slate-700/60">
              <span className="inline-flex max-w-full items-center gap-2">
                <span
                  className="inline-block h-0.5 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: FUND_COLOR }}
                />
                <span className="truncate text-muted-foreground">{fundName}</span>
              </span>
              <span className="inline-flex max-w-full items-center gap-2">
                <span
                  className="inline-block h-0.5 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: BENCHMARK_COLOR }}
                />
                <span className="truncate text-muted-foreground">{benchmarkName}</span>
              </span>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Hover a point for the full rolling window range ({period}).
            </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="absolute" className="m-0 px-4 py-6 sm:px-6">
          {indexedNavLoading && absoluteChartData.length === 0 ? (
            <Skeleton className={CHART_HEIGHT_CLASS} />
          ) : absoluteChartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Indexed NAV history is not available yet
            </p>
          ) : (
            <div className={CHART_PANEL_CLASS}>
            <ChartContainer config={absoluteConfig} className={CHART_HEIGHT_CLASS}>
              <LineChart data={absoluteChartData} margin={chartPlotMargin({ top: 16, right: 12, bottom: 8 })}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis
                  dataKey="date"
                  tickLine={TICK_LINE}
                  axisLine={AXIS_LINE}
                  minTickGap={axis.xGap}
                  tick={axis.tick}
                  height={axis.xHeight}
                >
                  <Label {...xLabel('Date', -2)} />
                </XAxis>
                <YAxis
                  tickLine={TICK_LINE}
                  axisLine={AXIS_LINE}
                  tick={axis.tick}
                  tickFormatter={formatIndexedNavTick}
                  width={axis.yWidth}
                  domain={Y_DOMAIN}
                >
                  {axis.showYLabel ? (
                    <Label value="Indexed NAV" angle={-90} position="insideLeft" style={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  ) : null}
                </YAxis>
                <ChartTooltip
                  cursor={CHART_TOOLTIP_CURSOR}
                  content={<ChartTooltipContent format="number" />}
                />
                <Line
                  type="monotone"
                  dataKey="indexValue"
                  stroke={FUND_COLOR}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Indexed NAV rebases to 100 at the start of the selected window ({period}).
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
