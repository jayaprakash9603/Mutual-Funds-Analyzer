import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { FundSelector } from '@/components/dashboard/FundSelector'
import { DemoFundPicker } from '@/components/demo/DemoFundPicker'
import { GoldenTriangleResultCard } from '@/components/dashboard/GoldenTriangleResultCard'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import { AXIS_LINE, drawdownYDomain, formatAxisPercentTick, GRID_STROKE, MARGIN_X, TICK_LINE, TICK_MD, xLabel, yLabel, ZERO_LINE_STROKE } from '@/lib/chartAxes'
import { CHART_COLORS } from '@/lib/chartColors'
import { formatPercent } from '@/lib/utils'
import { useFundReport } from '@/features/fund-report/hooks/useFundReport'
import { useFundReportMatrix } from '@/features/fund-report/hooks/useFundReportMatrix'
import { useSectionNav } from '@/features/fund-report/hooks/useSectionNav'
import { DrawdownEpisodesTable } from '@/features/fund-report/components/DrawdownEpisodesTable'
import { HeatMatrix, HeatMatrixSkeleton } from '@/features/fund-report/components/HeatMatrix'
import { RareInstancesMatrixTable } from '@/features/fund-report/components/RareInstancesMatrixTable'
import { MultiplyProbabilityTable } from '@/features/fund-report/components/MultiplyProbabilityTable'
import { FundRollingReturnsTable } from '@/components/fundsindia/FundRollingReturnsTable'
import { ReportSectionNav, REPORT_SECTIONS } from '@/features/fund-report/components/ReportSectionNav'
import { GaugeMeter, ProbabilityBar, VerdictBadge } from '@/features/fund-report/components/ReportVisuals'
import { MetricTile, SectionShell, UnavailableNotice } from '@/features/fund-report/components/SectionShell'
import { fetchPeerComparison } from '@/features/fund-report/api'
import { PeerComparisonTable } from '@/features/fund-report/components/PeerComparisonTable'
import { AnnualStressAnalysis } from '@/features/fund-report/components/AnnualStressAnalysis'
import { TrailingReturnsTable } from '@/features/fund-report/components/TrailingReturnsTable'
import type { FundReport } from '@/features/fund-report/schemas'
import type { GoldenTriangleResult } from '@/api/schemas'

const SECTION_IDS = REPORT_SECTIONS.map((s) => s.id)

const drawdownChartConfig = {
  drawdownPercent: { label: 'Drawdown', color: CHART_COLORS.red },
}

function toGoldenTriangle(result: FundReport['goldenTriangle']): GoldenTriangleResult {
  return result as GoldenTriangleResult
}

export function FundReportPage() {
  const { scheme: routeScheme } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [scheme, setScheme] = useState(routeScheme ?? searchParams.get('scheme') ?? '')
  const [matrixMode, setMatrixMode] = useState<'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M'>('LUMPSUM')

  const { data, loading, error } = useFundReport(scheme || null)
  const activeSection = useSectionNav(SECTION_IDS)
  const { data: matrix, loading: matrixLoading, error: matrixError } = useFundReportMatrix(
    scheme || null,
    matrixMode,
    !!data,
  )
  const { data: multipleMatrix, loading: multipleMatrixLoading } = useFundReportMatrix(
    scheme || null,
    'MULTIPLE',
    !!data,
  )

  const stars = useMemo(() => '★'.repeat(data?.profile.overallRatingStars ?? 0), [data])

  const selectScheme = (next: string) => {
    setScheme(next)
    setSearchParams({ scheme: next })
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Fund Report</h1>
        <p className="text-muted-foreground">
          FundsIndia-style analysis — returns, consistency, drawdowns, and investment verdict.
        </p>
      </header>

      <DemoFundPicker selectedScheme={scheme} onSelect={selectScheme} />

      <FundSelector
        mode="fund-only"
        selectedScheme={scheme}
        onSelectScheme={selectScheme}
      />

      <ReportSectionNav activeSection={activeSection} />

      {loading && !data && (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-4 rounded-full" />
            Loading report for selected fund…
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}
      {error && !data && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div>
      )}
      {!scheme && !loading && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Search and select a fund to generate the full report.
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <SectionShell id="overview" title="Fund Overview" description="Key fund facts and quick rating.">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricTile label="Fund" value={data.profile.fundName} />
              <MetricTile label="AMC" value={data.profile.amc || '—'} />
              <MetricTile label="Category" value={data.profile.category || '—'} />
              <MetricTile label="Benchmark" value={data.profile.benchmarkName} />
              <MetricTile label="NAV" value={`₹${data.profile.latestNav.toFixed(2)}`} />
              <MetricTile label="Fund Age" value={`${data.profile.fundAgeYears.toFixed(1)} yrs`} />
              <MetricTile label="Rating" value={`${stars} ${data.profile.overallRatingLabel}`} />
              <MetricTile label="Data Range" value={`${data.profile.dataFrom.slice(0, 10)} → ${data.profile.dataTo.slice(0, 10)}`} />
            </div>
          </SectionShell>

          <SectionShell id="golden-triangle" title="Golden Triangle Score" description="Rolling return, COB, and Sharpe vs benchmark.">
            <GoldenTriangleResultCard result={toGoldenTriangle(data.goldenTriangle)} />
          </SectionShell>

          <SectionShell id="returns" title="Returns Dashboard" description="Absolute return, CAGR, and growth of ₹10,000.">
            <TrailingReturnsTable
              periods={data.trailingReturns.periods}
              fundName={data.profile.fundName}
            />
          </SectionShell>

          <SectionShell
            id="rolling"
            title="Rolling Returns"
            description="Fund rolling return statistics across 1Y, 3Y, 5Y, 7Y, 10Y, and 15Y windows — computed from daily NAV."
          >
            <FundRollingReturnsTable
              rollingReturns={data.rollingReturns}
              fundName={data.profile.fundName}
              dataTo={data.profile.dataTo}
            />
          </SectionShell>

          <SectionShell id="benchmark" title="Benchmark Comparison">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricTile label="Fund Return" value={formatPercent(data.benchmarkComparison.fundTotalReturn)} />
              <MetricTile label="Benchmark" value={formatPercent(data.benchmarkComparison.benchmarkTotalReturn)} />
              <MetricTile label="Win Rate" value={`${data.benchmarkComparison.winningPercent.toFixed(0)}%`} metricKey="cob" />
            </div>
            <p className="mt-3 text-sm">{data.benchmarkComparison.explanation}</p>
          </SectionShell>

          <SectionShell id="probability" title="Probability Analysis" description="Historical odds from rolling windows and multiply targets.">
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <ProbabilityBar label="Positive return" value={data.probability.positiveReturn} />
              <ProbabilityBar label="Beat inflation (~7%)" value={data.probability.beatInflation} />
              <ProbabilityBar label="Beat benchmark" value={data.probability.beatBenchmark} />
              <ProbabilityBar label="&gt;10% CAGR" value={data.probability.above10Cagr} />
              <ProbabilityBar label="Double money (7Y)" value={data.probability.doubleMoney} />
              <ProbabilityBar label="Triple money (7Y)" value={data.probability.tripleMoney} />
            </div>
            {multipleMatrix ? (
              <div className={multipleMatrixLoading ? 'opacity-70 transition-opacity' : undefined}>
                <MultiplyProbabilityTable
                  matrix={multipleMatrix}
                  fundName={data.profile.fundName}
                  benchmarkName={data.profile.benchmarkName}
                />
              </div>
            ) : multipleMatrixLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : null}
          </SectionShell>

          <SectionShell id="risk" title="Risk Analysis">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile label="Volatility" value={formatPercent(data.risk.volatility)} metricKey="volatility" />
              <MetricTile label="Sharpe" value={data.risk.sharpeRatio.toFixed(2)} metricKey="sharpe" />
              <MetricTile label="Sortino" value={data.risk.sortinoRatio.toFixed(2)} metricKey="sortino" />
              <MetricTile label="Beta" value={data.risk.beta.toFixed(2)} metricKey="beta" />
              <MetricTile label="Alpha" value={formatPercent(data.risk.alpha)} metricKey="alpha" />
              <MetricTile label="Max Drawdown" value={formatPercent(data.risk.maxDrawdown)} metricKey="maxDrawdown" />
              <MetricTile label="Info Ratio" value={data.risk.informationRatio.toFixed(2)} metricKey="informationRatio" />
              <MetricTile label="Risk Level" value={data.risk.riskLevel} />
            </div>
          </SectionShell>

          <SectionShell id="portfolio" title="Portfolio Analysis">
            <UnavailableNotice label="Portfolio holdings and sector allocation" />
          </SectionShell>

          <SectionShell
            id="consistency"
            title="Annual Drawdown vs Returns"
            description="Each year's worst peak-to-trough fall compared with the calendar-year return — FundsIndia-style stress analysis."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                Best year: {formatPercent(data.consistency.bestYear)}
              </Badge>
              <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-400">
                Worst year: {formatPercent(data.consistency.worstYear)}
              </Badge>
              <Badge variant="outline">Rating: {data.consistency.consistencyRating}</Badge>
            </div>
            <AnnualStressAnalysis
              calendarYears={data.consistency.calendarYears}
              fundName={data.profile.fundName}
              dataTo={data.profile.dataTo}
            />
          </SectionShell>

          <SectionShell
            id="sip"
            title="SIP Analysis"
            description={`Monthly SIP outcomes from daily NAV history (mfapi.in). ${data.tax.explanation}`}
          >
            <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Monthly SIP</th>
                    <th className="px-4 py-3">Invested</th>
                    <th className="px-4 py-3">Current value</th>
                    <th className="px-4 py-3">Gain</th>
                    <th className="px-4 py-3">XIRR</th>
                    <th className="px-4 py-3">STCG</th>
                    <th className="px-4 py-3">LTCG</th>
                    <th className="px-4 py-3">Post-tax return</th>
                    <th className="px-4 py-3">10Y projection</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sip.scenarios.map((s) => (
                    <tr key={s.monthlyAmount} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3 font-medium">
                        ₹{s.monthlyAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        ₹{s.moneyInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        ₹{s.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        +₹{s.totalGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">{s.xirr.toFixed(1)}%</td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        ₹{(s.stcg ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        ₹{(s.ltcg ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {formatPercent(s.postTaxReturn ?? 0)}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        ₹{s.projectedValue10Y.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionShell>

          <SectionShell id="lumpsum" title="Lump Sum Analysis">
            <Tabs value={matrixMode} onValueChange={(v) => setMatrixMode(v as typeof matrixMode)}>
              <TabsList>
                <TabsTrigger value="LUMPSUM">CAGR Matrix</TabsTrigger>
                <TabsTrigger value="MULTIPLE">Multiplier Matrix</TabsTrigger>
                <TabsTrigger value="SIP">SIP Matrix</TabsTrigger>
                <TabsTrigger value="STP_6M">6M STP Matrix</TabsTrigger>
              </TabsList>
              <TabsContent value={matrixMode} className="mt-4 w-full">
                {matrix ? (
                  <div className={matrixLoading ? 'opacity-70 transition-opacity' : undefined}>
                    <HeatMatrix data={matrix} />
                    {matrix.recovery ? (
                      <RareInstancesMatrixTable matrix={matrix} recovery={matrix.recovery} />
                    ) : null}
                  </div>
                ) : matrixLoading ? (
                  <HeatMatrixSkeleton />
                ) : matrixError ? (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    {matrixError}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Matrix data is not available for this mode.</p>
                )}
              </TabsContent>
            </Tabs>
            <div className="mt-5 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {data.lumpsum.scenarios.map((s) => (
                <MetricTile
                  key={s.principal}
                  size="lg"
                  label={`₹${(s.principal / 100000).toFixed(s.principal >= 100000 ? 0 : 1)}${s.principal >= 100000 ? 'L' : 'k'}`}
                  value={`₹${s.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  hint={`${s.moneyMultiplied.toFixed(2)}x · CAGR ${s.cagr.toFixed(1)}%`}
                />
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="drawdown"
            title="Drawdown Analysis"
            description="Peak-to-trough losses over time. Deeper red areas mark harder market stress periods."
          >
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricTile label="Biggest crash" value={formatPercent(-data.drawdown.biggestCrash)} metricKey="maxDrawdown" />
              <MetricTile label="Maximum loss" value={formatPercent(-data.drawdown.maximumLoss)} />
              <MetricTile
                label="Current drawdown"
                value={formatPercent(data.drawdown.currentDrawdown)}
              />
              <MetricTile label="Recovery time" value={`${data.drawdown.recoveryTimeYears.toFixed(1)} yrs`} />
              <MetricTile label="Avg recovery" value={`${data.drawdown.averageRecoveryYears.toFixed(1)} yrs`} />
              <MetricTile
                label="Episodes (≥10%)"
                value={String(data.drawdown.episodes.length)}
              />
            </div>
            <div className="w-full rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
              <ChartContainer config={drawdownChartConfig} className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]">
                <AreaChart
                  data={data.drawdown.series}
                  margin={{ ...MARGIN_X, left: 48 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="date"
                    tickLine={TICK_LINE}
                    axisLine={AXIS_LINE}
                    tick={TICK_MD}
                    minTickGap={48}
                    height={44}
                  >
                    <Label {...xLabel('Date', -2)} />
                  </XAxis>
                  <YAxis
                    tickLine={TICK_LINE}
                    axisLine={AXIS_LINE}
                    tick={TICK_MD}
                    tickFormatter={formatAxisPercentTick}
                    width={48}
                    domain={drawdownYDomain(data.drawdown.series)}
                    type="number"
                  >
                    <Label {...yLabel('Drawdown (%)')} />
                  </YAxis>
                  <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} strokeOpacity={0.35} strokeWidth={1.5} />
                  <ChartTooltip
                    cursor={CHART_TOOLTIP_CURSOR}
                    content={<ChartTooltipContent format="percent" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdownPercent"
                    stroke={CHART_COLORS.red}
                    fill={CHART_COLORS.red}
                    fillOpacity={0.22}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            <DrawdownEpisodesTable drawdown={data.drawdown} />
          </SectionShell>

          <SectionShell id="expense" title="Expense Analysis">
            {data.expense.expenseRatio == null ? (
              <UnavailableNotice label="Expense ratio and category comparison" />
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <MetricTile label="Expense ratio" value={`${data.expense.expenseRatio}%`} />
                <MetricTile label="10Y cost on ₹1L" value={`₹${data.expense.costOver10Years?.toFixed(0)}`} />
                <MetricTile label="20Y cost on ₹1L" value={`₹${data.expense.costOver20Years?.toFixed(0)}`} />
              </div>
            )}
          </SectionShell>

          <PeerSection scheme={scheme} category={data.profile.category} />

          <SectionShell
            id="quality"
            title="Fund Quality Score"
            description="Scored from known NAV metrics only — Standard Deviation and Beta Risk Level replace expense and diversification when those are unavailable."
          >
            <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:gap-10">
              <div className="flex shrink-0 flex-col items-center justify-center lg:w-56">
                <GaugeMeter score={data.qualityScore.score} label="Overall Quality" />
              </div>
              <div className="grid w-full flex-1 gap-3 sm:grid-cols-2">
                {data.qualityScore.components
                  .filter((c) => c.name !== 'Expense Ratio' && c.name !== 'Diversification')
                  .map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm"
                    >
                      <span>{c.name}</span>
                      <span className="font-mono text-base font-medium">{c.score}/100</span>
                    </div>
                  ))}
              </div>
            </div>
          </SectionShell>

          <SectionShell id="insights" title="AI Insights">
            <InsightsPanel result={toGoldenTriangle(data.goldenTriangle)} insights={data.insights} />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold text-primary">Pros</h4>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {data.prosCons.pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-destructive">Cons</h4>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {data.prosCons.cons.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Ideal Investor</h4>
              <div className="flex flex-wrap gap-2">
                {data.investorFit.suitableFor.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
          </SectionShell>

          <SectionShell id="verdict" title="Final Recommendation">
            <div className="flex flex-col items-center gap-4 text-center">
              <VerdictBadge verdict={data.recommendation.verdict} confidence={data.recommendation.confidencePercent} />
              <p className="max-w-2xl text-muted-foreground">{data.recommendation.summary}</p>
            </div>
          </SectionShell>
        </div>
      )}
    </div>
  )
}

function PeerSection({ scheme, category }: { scheme: string; category: string }) {
  const [peers, setPeers] = useState<Awaited<ReturnType<typeof fetchPeerComparison>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPeers(null)
    setLoading(false)
    setError(null)
  }, [scheme, category])

  const load = () => {
    if (!scheme) return
    setPeers(null)
    setError(null)
    setLoading(true)
    fetchPeerComparison(scheme, category || 'All')
      .then(setPeers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load peer comparison'))
      .finally(() => setLoading(false))
  }

  return (
    <SectionShell id="peers" title="Peer Comparison" description="Top funds in the same category.">
      <button
        type="button"
        onClick={load}
        disabled={loading || !scheme}
        className="mb-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
      >
        {loading ? 'Loading…' : 'Load peer comparison'}
      </button>
      {(loading || peers || error) && (
        <PeerComparisonTable data={peers} loading={loading} error={error} />
      )}
    </SectionShell>
  )
}

export default FundReportPage
