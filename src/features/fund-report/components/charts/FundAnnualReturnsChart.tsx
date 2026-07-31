import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Label, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  CHART_TOOLTIP_CURSOR,
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { ChartShell, chartHeightForGuide } from '@/components/charts/ChartShell'
import { CHART_GUIDES } from '@/lib/analytics/chartGuide'
import { getAnnualReturns } from '@/lib/analytics/chartData'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  MARGIN_X,
  TICK_LINE,
  ZERO_LINE_STROKE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { DEFAULT_PERIOD } from '@/lib/constants'

const FUND_COLOR = CHART_COLORS.fund
const BENCHMARK_COLOR = CHART_COLORS.benchmark

type AnnualReturnRow = {
  year: string
  fund: number
  benchmark: number
}

function AnnualReturnsTooltip({
  active,
  payload,
  label,
  fundName,
  benchmarkName,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: AnnualReturnRow }>
  label?: string | number
  fundName: string
  benchmarkName: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  const lead = row.fund - row.benchmark

  return (
    <div className="min-w-[240px] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[2px]" style={{ backgroundColor: FUND_COLOR }} aria-hidden="true" />
          {fundName}
        </span>
        <span className="font-mono font-semibold tabular-nums">{row.fund.toFixed(2)}%</span>
      </p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[2px]" style={{ backgroundColor: BENCHMARK_COLOR }} aria-hidden="true" />
          {benchmarkName}
        </span>
        <span className="font-mono font-semibold tabular-nums">{row.benchmark.toFixed(2)}%</span>
      </p>
      <p className="mt-1 flex items-center justify-between gap-4 border-t border-border/70 pt-1">
        <span className="text-muted-foreground">Lead</span>
        <span
          className={`font-mono font-semibold tabular-nums ${lead >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {lead >= 0 ? '+' : ''}
          {lead.toFixed(2)}%
        </span>
      </p>
    </div>
  )
}

export function FundAnnualReturnsChart({
  scheme,
  fundName,
  benchmarkName,
  startDate,
  offlineView = false,
}: {
  scheme: string
  fundName: string
  benchmarkName: string
  startDate?: string
  offlineView?: boolean
}) {
  const axis = useResponsiveAxis()
  const { data, result, loading, error } = useFundAnalysis(
    offlineView ? null : scheme,
    DEFAULT_PERIOD,
    startDate,
  )

  const annualReturns = useMemo<AnnualReturnRow[]>(
    () => (data ? getAnnualReturns({ fund: data.fund, benchmark: data.benchmark, period: DEFAULT_PERIOD }) : []),
    [data],
  )

  const resolvedFundName = result?.fundName ?? fundName
  const resolvedBenchmarkName = result?.benchmarkName ?? benchmarkName

  const chartConfig = useMemo(
    () =>
      ({
        fund: { label: resolvedFundName, color: FUND_COLOR },
        benchmark: { label: resolvedBenchmarkName, color: BENCHMARK_COLOR },
      }) satisfies ChartConfig,
    [resolvedBenchmarkName, resolvedFundName],
  )

  const yearsWon = annualReturns.filter((row) => row.fund >= row.benchmark).length
  const negativeYears = annualReturns.filter((row) => row.fund < 0).length

  if (offlineView) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Calendar-year returns need live benchmark data and are not included in shared snapshots.
      </p>
    )
  }

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
        {error}
      </p>
    )
  }

  return (
    <ChartShell
      guide={CHART_GUIDES.annualReturns}
      variant="flat"
      loading={loading && annualReturns.length === 0}
      empty={!loading && annualReturns.length === 0}
      footer={
        annualReturns.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/70 pt-3 text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-[2px]" style={{ backgroundColor: FUND_COLOR }} aria-hidden="true" />
              <span className="truncate text-muted-foreground">{resolvedFundName}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-[2px]" style={{ backgroundColor: BENCHMARK_COLOR }} aria-hidden="true" />
              <span className="truncate text-muted-foreground">{resolvedBenchmarkName}</span>
            </span>
            <span className="text-muted-foreground">
              Fund led in{' '}
              <span className="font-semibold text-foreground">
                {yearsWon} of {annualReturns.length}
              </span>{' '}
              years · <span className="font-semibold text-foreground">{negativeYears}</span> negative year
              {negativeYears === 1 ? '' : 's'}
            </span>
          </div>
        ) : null
      }
    >
      <ChartContainer config={chartConfig} className={chartHeightForGuide(CHART_GUIDES.annualReturns)}>
        <BarChart data={annualReturns} margin={MARGIN_X}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            tick={axis.tick}
            height={axis.xHeight}
            minTickGap={4}
          >
            <Label {...xLabel('Year', -4)} />
          </XAxis>
          <YAxis
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            unit="%"
            tick={axis.tick}
            width={axis.yWidth}
          >
            {axis.showYLabel ? <Label {...yLabel('Return (%)')} /> : null}
          </YAxis>
          <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} strokeWidth={1} />
          <ChartTooltip
            cursor={CHART_TOOLTIP_CURSOR}
            content={
              <AnnualReturnsTooltip fundName={resolvedFundName} benchmarkName={resolvedBenchmarkName} />
            }
          />
          <Bar dataKey="fund" fill={FUND_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar
            dataKey="benchmark"
            fill={BENCHMARK_COLOR}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  )
}
