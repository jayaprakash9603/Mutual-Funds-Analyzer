import { useMemo } from 'react'
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer } from '@/components/ui/chart'
import { CHART_PANEL_RESPONSIVE_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { useFundReportMatrix } from '../../hooks/useFundReportMatrix'
import { useSwpSequenceRisk } from '../../hooks/useSwpSequenceRisk'
import { ReportInsightCard } from '../layout/ReportInsightCard'
import type { SwpSurvivalPoint } from '../../hooks/useSwpSequenceRisk'

function SurvivalTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: SwpSurvivalPoint }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-semibold">Year {row.yearsElapsed}</p>
      <p className="tabular-nums text-muted-foreground">
        {row.percentSurviving.toFixed(0)}% of start years still funded
      </p>
    </div>
  )
}

export function SwpSequenceRiskChart({
  scheme,
  initialCorpus,
  monthlyWithdrawal,
  scheduleDay,
  isSharedView = false,
}: {
  scheme: string
  initialCorpus: number
  monthlyWithdrawal: number
  scheduleDay: number
  isSharedView?: boolean
}) {
  const axis = useResponsiveAxis()
  const matrixEnabled = !!scheme && !isSharedView
  const { data: matrix, loading: matrixLoading } = useFundReportMatrix(
    scheme || null,
    'SWP',
    matrixEnabled,
  )

  const { data, loading, progress, error, run, hasRun } = useSwpSequenceRisk({
    scheme,
    matrix,
    initialCorpus,
    monthlyWithdrawal,
    scheduleDay,
    horizonYears: 10,
    enabled: matrixEnabled,
  })

  const chartData = useMemo(() => data?.survival ?? [], [data])

  if (isSharedView) {
    return (
      <p className="text-sm text-muted-foreground">
        Sequence-of-returns testing is not available in shared snapshots.
      </p>
    )
  }

  return (
    <ReportInsightCard
      title="Sequence-of-returns risk"
      subtitle="Replay this SWP from every historical Jan-1 start year and track how often the corpus survives."
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Runs one SWP simulation per Jan-1 start year (≥5 years of subsequent history). On demand —
          does not fire automatically.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || matrixLoading || !matrix}
          onClick={run}
        >
          {hasRun ? 'Re-run sequence test' : 'Run sequence test'}
        </Button>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <p className="text-xs text-muted-foreground">
              {progress
                ? `Testing ${progress.done} of ${progress.total} start years…`
                : 'Starting sequence test…'}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!loading && data && chartData.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">{data.caption}</p>
            <div className={CHART_PANEL_RESPONSIVE_CLASS}>
              <ChartContainer
                config={{}}
                className="aspect-auto h-[260px] w-full sm:h-[320px] lg:h-[360px]"
              >
                <LineChart data={chartData} margin={chartPlotMargin({ top: 12, bottom: 8 })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="yearsElapsed"
                    tickLine={TICK_LINE}
                    axisLine={AXIS_LINE}
                    tick={axis.tick}
                    tickFormatter={(value) => `${value}Y`}
                  >
                    {axis.showXLabel ? <Label {...xLabel('Years elapsed')} /> : null}
                  </XAxis>
                  <YAxis
                    tickLine={TICK_LINE}
                    axisLine={AXIS_LINE}
                    tick={axis.tick}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                    width={axis.yWidth}
                  >
                    {axis.showYLabel ? <Label {...yLabel('% still funded')} /> : null}
                  </YAxis>
                  <Tooltip content={<SurvivalTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                  />
                  <ReferenceLine
                    x={data.horizonYears}
                    stroke={CHART_COLORS.violet}
                    strokeDasharray="4 4"
                    label={{
                      value: `${data.horizonYears}Y horizon`,
                      position: 'insideTopRight',
                      fill: CHART_COLORS.violet,
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="percentSurviving"
                    name="% of starts still funded"
                    stroke={CHART_COLORS.fund}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: CHART_COLORS.fund }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Tested {data.testedStarts} Jan-1 starts · {data.depletedWithinHorizon} depleted within{' '}
              {data.horizonYears} years at ₹{monthlyWithdrawal.toLocaleString('en-IN')}/mo from{' '}
              ₹{initialCorpus.toLocaleString('en-IN')}.
            </p>
          </>
        ) : null}

        {!loading && hasRun && !data && !error ? (
          <p className="text-sm text-muted-foreground">Insufficient history to test.</p>
        ) : null}
      </div>
    </ReportInsightCard>
  )
}
