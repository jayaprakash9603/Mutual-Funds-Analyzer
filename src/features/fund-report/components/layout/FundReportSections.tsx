import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { GoldenTriangleResultCard } from '@/components/dashboard/cards/GoldenTriangleResultCard'
import { InsightsPanel } from '@/components/dashboard/widgets/InsightsPanel'
import { FundRollingReturnsTable } from '@/components/fundsindia/FundRollingReturnsTable'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollTable } from '@/components/ui/scroll-table'
import { fiStickyLabelCell } from '@/components/fundsindia/tableStyles'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import {
  AXIS_LINE,
  drawdownYDomain,
  formatAxisPercentTick,
  GRID_STROKE,
  MARGIN_X,
  TICK_LINE,
  TICK_MD,
  xLabel,
  yLabel,
  ZERO_LINE_STROKE,
} from '@/lib/charts/chartAxes'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { cn, formatPercent } from '@/lib/utils'
import type { GoldenTriangleResult } from '@/api/schemas'
import { fetchPeerComparison } from '../../api'
import type { ProgressiveFundReportGroups } from '../../hooks/useProgressiveFundReport'
import { useFundReportMatrix } from '../../hooks/useFundReportMatrix'
import type { ReportSectionState } from '../../hooks/useReportSection'
import type {
  FundReportAssessment,
  FundReportInvestment,
  FundReportOverview,
  FundReportPerformance,
  FundReportRisk,
  PeerComparison,
} from '../../schemas'
import { AnnualStressAnalysis } from './AnnualStressAnalysis'
import { ReportInsightCard } from './ReportInsightCard'
import { SectionHeadline } from './StatHeadline'
import {
  buildAllTimeHighsHeadline,
  buildBearMarketHeadline,
  buildBenchmarkHeadline,
  buildBestDaysHeadline,
  buildDistributionHeadline,
  buildDrawdownHeadline,
  buildIntraYearDeclineHeadline,
  buildLumpsumHeadline,
  buildProbabilityHeadline,
  buildRollingReturnsHeadline,
  buildSipHeadline,
  buildSortedReturnsHeadline,
  buildTrailingReturnsHeadline,
} from '../../lib/headlines/sectionHeadlines'
import {
  BearMarketDecadeChart,
  hasDecadeHistory,
} from '../charts/BearMarketDecadeChart'
import { DeclineRecoveryChart } from '../charts/DeclineRecoveryChart'
import { FundReportReturnsChart } from '../charts/FundReportReturnsChart'
import { MissingBestDaysChart } from '../charts/MissingBestDaysChart'
import { BestDaysInCrashAnalysis } from '../charts/BestDaysInCrashAnalysis'
import { AllTimeHighsChart } from '../charts/AllTimeHighsChart'
import { AllTimeHighsYearTable } from '../charts/AllTimeHighsYearTable'
import { AthDeclineOutlookChart } from '../charts/AthDeclineOutlookChart'
import { PostAthReturnsTable } from '../charts/PostAthReturnsTable'
import { AnnualReturnDistributionChart } from '../charts/AnnualReturnDistributionChart'
import { RollingHorizonProbabilityCharts } from '../charts/RollingHorizonProbabilityCharts'
import { SortedCalendarReturnsChart } from '../charts/SortedCalendarReturnsChart'
import { ProfitBookingComparisonTable } from '../charts/ProfitBookingComparisonTable'
import { DrawdownEpisodesTable } from '../tables/DrawdownEpisodesTable'
import { DrawdownThresholdTable } from '../tables/DrawdownThresholdTable'
import { HeatMatrix, HeatMatrixSkeleton } from '../charts/HeatMatrix'
import { MultiplyProbabilityTable } from '../tables/MultiplyProbabilityTable'
import { PeerComparisonTable } from '../tables/PeerComparisonTable'
import { GaugeMeter, ProbabilityBar, VerdictBadge } from '../charts/ReportVisuals'
import {
  CardSkeleton,
  ChartSkeleton,
  MetricGridSkeleton,
  ReportGroupBoundary,
  TableSkeleton,
} from './ReportGroupBoundary'
import { MetricTile, SectionShell, UnavailableNotice } from './SectionShell'
import { TrailingReturnsTable } from '../tables/TrailingReturnsTable'
import { RareInstancesMatrixTable } from '../tables/RareInstancesMatrixTable'
import {
  sectionNeedsMatrix,
  sectionNeedsMultipleMatrix,
  sectionNeedsPeersFetch,
} from '../../lib/nav/reportSectionRequirements'

const drawdownChartConfig = {
  drawdownPercent: { label: 'Drawdown', color: CHART_COLORS.red },
}

function toGoldenTriangle(result: FundReportAssessment['goldenTriangle']): GoldenTriangleResult {
  return result as GoldenTriangleResult
}

type FundReportSectionsProps = {
  scheme: string
  groups: ProgressiveFundReportGroups
  overview: ReportSectionState<FundReportOverview>
  performance: ReportSectionState<FundReportPerformance>
  risk: ReportSectionState<FundReportRisk>
  investment: ReportSectionState<FundReportInvestment>
  assessment: ReportSectionState<FundReportAssessment>
  peersSnapshot?: PeerComparison | null
  isSharedView?: boolean
  onPeersLoaded?: (peers: PeerComparison | null) => void
  exportRootId?: string
  exportTitle?: string
  activeSection?: string
  renderAll?: boolean
}

export function FundReportSections({
  scheme,
  overview,
  performance,
  risk,
  investment,
  assessment,
  peersSnapshot = null,
  isSharedView = false,
  onPeersLoaded,
  exportRootId = 'fund-report-export-root',
  exportTitle,
  activeSection = 'overview',
  renderAll = false,
}: FundReportSectionsProps) {
  const [matrixMode, setMatrixMode] = useState<'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M'>('LUMPSUM')
  const schemeSelected = !!scheme
  const matrixActive = renderAll || sectionNeedsMatrix(activeSection)
  const multipleMatrixActive = renderAll || sectionNeedsMultipleMatrix(activeSection)
  const peersActive = renderAll || sectionNeedsPeersFetch(activeSection)
  const matrixEnabled = schemeSelected && !isSharedView && matrixActive

  const { data: matrix, loading: matrixLoading, error: matrixError, retry: retryMatrix } =
    useFundReportMatrix(scheme || null, matrixMode, matrixEnabled)
  const { data: multipleMatrix, loading: multipleMatrixLoading } = useFundReportMatrix(
    scheme || null,
    'MULTIPLE',
    schemeSelected && !isSharedView && multipleMatrixActive,
  )

  const profile = overview.data?.profile
  const fundName = profile?.fundName ?? scheme ?? 'Fund'
  const benchmarkName = profile?.benchmarkName ?? 'Benchmark'
  const category = profile?.category ?? ''
  const dataTo = profile?.dataTo ?? ''
  const dataFrom = profile?.dataFrom ?? ''

  const shouldRender = (sectionId: string) => renderAll || activeSection === sectionId

  const stars = useMemo(
    () => '★'.repeat(profile?.overallRatingStars ?? 0),
    [profile?.overallRatingStars],
  )

  return (
    <div id={exportRootId} className="space-y-6">
      {exportTitle ? (
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">{exportTitle}</h2>
          <p className="text-xs text-muted-foreground">Fund report snapshot</p>
        </div>
      ) : null}
      {shouldRender("overview") ? (
      <SectionShell id="overview" title="Fund Overview" description="Key fund facts and quick rating.">
        <ReportGroupBoundary state={overview} skeleton={<MetricGridSkeleton count={8} />}>
          {(data) => (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricTile label="Fund" value={data.profile.fundName} />
              <MetricTile label="AMC" value={data.profile.amc || '—'} />
              <MetricTile label="Category" value={data.profile.category || '—'} />
              <MetricTile label="Benchmark" value={data.profile.benchmarkName} />
              <MetricTile label="NAV" value={`₹${data.profile.latestNav.toFixed(2)}`} />
              <MetricTile label="Fund Age" value={`${data.profile.fundAgeYears.toFixed(1)} yrs`} />
              <MetricTile label="Rating" value={`${stars} ${data.profile.overallRatingLabel}`} />
              <MetricTile
                label="Data Range"
                value={`${data.profile.dataFrom.slice(0, 10)} → ${data.profile.dataTo.slice(0, 10)}`}
              />
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("golden-triangle") ? (
      <SectionShell
        id="golden-triangle"
        title="Golden Triangle Score"
        description="Rolling return, COB, and Sharpe vs benchmark."
      >
        <div className="space-y-6">
          {scheme ? (
            <FundReportReturnsChart
              scheme={scheme}
              fundName={fundName}
              benchmarkName={benchmarkName}
              indexedNav={risk.data?.drawdown.indexedNav}
              indexedNavLoading={risk.loading && risk.data == null}
              offlineView={isSharedView}
            />
          ) : null}
          <ReportGroupBoundary state={assessment} skeleton={<CardSkeleton />}>
            {(data) => <GoldenTriangleResultCard result={toGoldenTriangle(data.goldenTriangle)} />}
          </ReportGroupBoundary>
        </div>
      </SectionShell>
      ) : null}

      {shouldRender("returns") ? (
      <SectionShell id="returns" title="Returns Dashboard" description="Absolute return, CAGR, and growth of ₹10,000.">
        <ReportGroupBoundary state={performance} skeleton={<TableSkeleton rows={6} />}>
          {(data) => (
            <div className="space-y-4">
              <SectionHeadline
                headline={buildTrailingReturnsHeadline(data.trailingReturns, fundName)}
              />
              <TrailingReturnsTable periods={data.trailingReturns.periods} fundName={fundName} />
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("rolling") ? (
      <SectionShell
        id="rolling"
        title="Rolling Returns"
        description="Fund rolling return statistics across 1Y, 3Y, 5Y, 7Y, 10Y, and 15Y windows — computed from daily NAV."
      >
        <ReportGroupBoundary state={performance} skeleton={<TableSkeleton rows={6} />}>
          {(data) => (
            <div className="space-y-4">
              <SectionHeadline
                headline={buildRollingReturnsHeadline(data.rollingReturns, fundName)}
              />
              <FundRollingReturnsTable
                rollingReturns={data.rollingReturns}
                fundName={fundName}
                dataTo={dataTo}
              />
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("return-patterns") ? (
      <SectionShell
        id="return-patterns"
        variant="stack"
        title="Return Patterns"
        description="How often calendar years land in each return bucket, how rarely they match long-term averages, and why profit booking tends to lag buy-and-hold."
      >
        <ReportGroupBoundary state={performance} skeleton={<ChartSkeleton />}>
          {(data) => (
            <div className="space-y-4 sm:space-y-5">
              <SectionHeadline
                headline={buildDistributionHeadline(data.calendarYearInsights.distribution)}
              />
              <AnnualReturnDistributionChart
                distribution={data.calendarYearInsights.distribution}
                fundName={fundName}
              />
              <RollingHorizonProbabilityCharts
                rollingReturns={data.rollingReturns}
                fundName={fundName}
              />
              <SectionHeadline
                size="md"
                headline={buildSortedReturnsHeadline(data.calendarYearInsights.sortedReturns)}
              />
              <SortedCalendarReturnsChart
                sortedReturns={data.calendarYearInsights.sortedReturns}
                fundName={fundName}
              />
              <ProfitBookingComparisonTable profitBooking={data.calendarYearInsights.profitBooking} />
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("benchmark") ? (
      <SectionShell id="benchmark" title="Benchmark Comparison">
        <ReportGroupBoundary state={performance} skeleton={<MetricGridSkeleton count={3} />}>
          {(data) => (
            <>
              <SectionHeadline
                className="mb-4"
                headline={buildBenchmarkHeadline(
                  data.benchmarkComparison,
                  fundName,
                  benchmarkName,
                )}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile
                  label="Fund Return"
                  value={formatPercent(data.benchmarkComparison.fundTotalReturn)}
                />
                <MetricTile
                  label="Benchmark"
                  value={formatPercent(data.benchmarkComparison.benchmarkTotalReturn)}
                />
                <MetricTile
                  label="Win Rate"
                  value={`${data.benchmarkComparison.winningPercent.toFixed(0)}%`}
                  metricKey="cob"
                />
              </div>
              <p className="mt-3 text-sm">{data.benchmarkComparison.explanation}</p>
            </>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("probability") ? (
      <SectionShell
        id="probability"
        title="Probability Analysis"
        description="Historical odds from rolling windows and multiply targets."
      >
        <ReportGroupBoundary state={performance} skeleton={<MetricGridSkeleton count={6} />}>
          {(data) => (
            <>
              <SectionHeadline
                className="mb-5"
                headline={buildProbabilityHeadline(data.probability, fundName)}
              />
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <ProbabilityBar label="Positive return" value={data.probability.positiveReturn} />
                <ProbabilityBar label="Beat inflation (~7%)" value={data.probability.beatInflation} />
                <ProbabilityBar label="Beat benchmark" value={data.probability.beatBenchmark} />
                <ProbabilityBar label="&gt;10% CAGR" value={data.probability.above10Cagr} />
                <ProbabilityBar label="Double money (7Y)" value={data.probability.doubleMoney} />
                <ProbabilityBar label="Triple money (7Y)" value={data.probability.tripleMoney} />
              </div>
              {isSharedView ? (
                <p className="text-sm text-muted-foreground">
                  Multiply-probability matrix is not included in shared snapshots.
                </p>
              ) : multipleMatrix ? (
                <div className={multipleMatrixLoading ? 'opacity-70 transition-opacity' : undefined}>
                  <MultiplyProbabilityTable
                    matrix={multipleMatrix}
                    fundName={fundName}
                    benchmarkName={benchmarkName}
                  />
                </div>
              ) : multipleMatrixLoading ? (
                <CardSkeleton />
              ) : null}
            </>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("risk") ? (
      <SectionShell id="risk" title="Risk Analysis">
        <ReportGroupBoundary state={risk} skeleton={<MetricGridSkeleton count={8} />}>
          {(data) => (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile label="Volatility" value={formatPercent(data.risk.volatility)} metricKey="volatility" />
              <MetricTile label="Sharpe" value={data.risk.sharpeRatio.toFixed(2)} metricKey="sharpe" />
              <MetricTile label="Sortino" value={data.risk.sortinoRatio.toFixed(2)} metricKey="sortino" />
              <MetricTile label="Beta" value={data.risk.beta.toFixed(2)} metricKey="beta" />
              <MetricTile label="Alpha" value={formatPercent(data.risk.alpha)} metricKey="alpha" />
              <MetricTile
                label="Max Drawdown"
                value={formatPercent(data.risk.maxDrawdown)}
                metricKey="maxDrawdown"
              />
              <MetricTile
                label="Info Ratio"
                value={data.risk.informationRatio.toFixed(2)}
                metricKey="informationRatio"
              />
              <MetricTile label="Risk Level" value={data.risk.riskLevel} />
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("portfolio") ? (
      <SectionShell id="portfolio" title="Portfolio Analysis">
        <UnavailableNotice label="Portfolio holdings and sector allocation" />
      </SectionShell>
      ) : null}

      {shouldRender("consistency") ? (
      <SectionShell
        id="consistency"
        title="Annual Drawdown vs Returns"
        description="Each year's worst peak-to-trough fall compared with the calendar-year return — FundsIndia-style stress analysis."
      >
        <ReportGroupBoundary state={risk} skeleton={<ChartSkeleton />}>
          {(data) => (
            <>
              <SectionHeadline
                className="mb-4"
                headline={buildIntraYearDeclineHeadline(data.consistency, fundName)}
              />
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
                fundName={fundName}
                dataTo={dataTo}
              />
            </>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      <SectionShell
        id="sip"
        title="SIP Analysis"
        description="Monthly SIP outcomes from daily NAV history (mfapi.in). Tax assumes a full redemption today: each instalment is taxed as its own lot — units held over 1 year at 12.5% above ₹1.25 lakh, newer units at 20%."
      >
        <ReportGroupBoundary state={investment} skeleton={<TableSkeleton rows={4} />}>
          {(data) => (
            <>
            <SectionHeadline className="mb-4" headline={buildSipHeadline(data.sip)} />
            <ScrollTable minWidth={960} className="rounded-xl border border-border/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className={cn('px-4 py-3', fiStickyLabelCell('normal-case'))}>Monthly SIP</th>
                    <th className="px-4 py-3">Invested</th>
                    <th className="px-4 py-3">Current value</th>
                    <th className="px-4 py-3">Gain</th>
                    <th className="px-4 py-3">XIRR</th>
                    <th className="px-4 py-3">Tax payable</th>
                    <th className="px-4 py-3">Post-tax XIRR</th>
                    <th className="px-4 py-3">10Y projection</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sip.scenarios.map((s) => {
                    const stcg = s.stcg ?? 0
                    const ltcg = s.ltcg ?? 0
                    const totalTax = stcg + ltcg
                    return (
                      <tr key={s.monthlyAmount} className="border-b border-border/40 last:border-0">
                        <td className={cn('px-4 py-3 font-medium', fiStickyLabelCell())}>
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
                        <td className="px-4 py-3">
                          <span className="block font-mono font-medium tabular-nums text-amber-700 dark:text-amber-400">
                            −₹{totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            STCG ₹{stcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })} · LTCG ₹
                            {ltcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums">
                          {formatPercent(s.postTaxXirr ?? 0, 1)}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums">
                          ₹{s.projectedValue10Y.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollTable>
            </>
          )}
        </ReportGroupBoundary>
      </SectionShell>

      {shouldRender("lumpsum") ? (
      <SectionShell id="lumpsum" title="Lump Sum Analysis">
        <ReportGroupBoundary state={investment} skeleton={null}>
          {(data) => (
            <SectionHeadline className="mb-4" headline={buildLumpsumHeadline(data.lumpsum)} />
          )}
        </ReportGroupBoundary>
        <Tabs value={matrixMode} onValueChange={(v) => setMatrixMode(v as typeof matrixMode)}>
          <TabsList scrollable>
            <TabsTrigger value="LUMPSUM">CAGR Matrix</TabsTrigger>
            <TabsTrigger value="MULTIPLE">Multiplier Matrix</TabsTrigger>
            <TabsTrigger value="SIP">SIP Matrix</TabsTrigger>
            <TabsTrigger value="STP_6M">6M STP Matrix</TabsTrigger>
          </TabsList>
          <TabsContent value={matrixMode} className="mt-4 w-full">
            {isSharedView ? (
              <p className="text-sm text-muted-foreground">
                Investment matrices are not included in shared snapshots.
              </p>
            ) : matrix ? (
              <div className={matrixLoading ? 'opacity-70 transition-opacity' : undefined}>
                <HeatMatrix data={matrix} />
                {matrix.recovery ? (
                  <RareInstancesMatrixTable matrix={matrix} recovery={matrix.recovery} />
                ) : null}
              </div>
            ) : matrixLoading ? (
              <HeatMatrixSkeleton />
            ) : matrixError ? (
              <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                <p>{matrixError}</p>
                <button
                  type="button"
                  onClick={retryMatrix}
                  className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium"
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Matrix data is not available for this mode.</p>
            )}
          </TabsContent>
        </Tabs>
        <ReportGroupBoundary state={investment} skeleton={<MetricGridSkeleton count={5} />}>
          {(data) => (
            <div className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("drawdown") ? (
      <SectionShell
        id="drawdown"
        title="Drawdown Analysis"
        description="Peak-to-trough losses over time. Deeper red areas mark harder market stress periods."
      >
        <ReportGroupBoundary state={risk} skeleton={<ChartSkeleton />}>
          {(data) => (
            <>
              <SectionHeadline
                className="mb-4"
                headline={buildDrawdownHeadline(data.drawdown, fundName)}
              />
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                <MetricTile
                  label="Biggest crash"
                  value={formatPercent(-data.drawdown.biggestCrash)}
                  metricKey="maxDrawdown"
                />
                <MetricTile label="Maximum loss" value={formatPercent(-data.drawdown.maximumLoss)} />
                <MetricTile
                  label="Current drawdown"
                  value={formatPercent(data.drawdown.currentDrawdown)}
                />
                <MetricTile
                  label="Recovery time"
                  value={`${data.drawdown.recoveryTimeYears.toFixed(1)} yrs`}
                />
                <MetricTile
                  label="Avg recovery"
                  value={`${data.drawdown.averageRecoveryYears.toFixed(1)} yrs`}
                />
                <MetricTile
                  label="Episodes (≥10%)"
                  value={String(data.drawdown.episodes.length)}
                />
              </div>
              <div className={`w-full ${CHART_PANEL_CLASS}`}>
                <ChartContainer
                  config={drawdownChartConfig}
                  className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]"
                >
                  <AreaChart data={data.drawdown.series} margin={{ ...MARGIN_X, left: 48 }}>
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
                    <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent format="percent" />} />
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
            </>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("bear-market") ? (
      <SectionShell
        id="bear-market"
        variant="stack"
        title="Bear Market & Recovery"
        description="How often the fund traded deep below its peak, compared with the benchmark and category peers, and how each crash-and-recovery cycle unfolded."
      >
        <ReportGroupBoundary state={risk} skeleton={<ChartSkeleton />}>
          {(data) => (
            <div className="space-y-4 sm:space-y-5">
              <SectionHeadline headline={buildBearMarketHeadline(data.drawdown, fundName)} />

              <ReportInsightCard title="Decade-wise bear market exposure">
                {hasDecadeHistory(dataFrom, dataTo) ? (
                  <BearMarketDecadeChart decades={data.drawdown.bearMarketDecades} fundName={fundName} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Decade-wise bear market analysis needs at least 10 years of NAV history (
                    {dataFrom.slice(0, 10)} → {dataTo.slice(0, 10)}).
                  </p>
                )}
              </ReportInsightCard>

              <ReportInsightCard title="Drawdown threshold frequency">
                <DrawdownThresholdTable
                  rows={data.drawdown.thresholdRows}
                  scheme={scheme}
                  category={category}
                  benchmarkName={benchmarkName}
                />
              </ReportInsightCard>

              <ReportInsightCard title="Decline & recovery timeline">
                <DeclineRecoveryChart
                  phases={data.drawdown.phases}
                  indexedNav={data.drawdown.indexedNav}
                  fundName={fundName}
                />
              </ReportInsightCard>
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("best-days") ? (
      <SectionShell
        id="best-days"
        variant="stack"
        title="Best Trading Days"
        description="How much return you give up by missing the fund’s strongest single-day moves, and when those days typically occur."
      >
        <ReportGroupBoundary state={risk} skeleton={<ChartSkeleton />}>
          {(data) => (
            <div className="space-y-4 sm:space-y-5">
              <SectionHeadline headline={buildBestDaysHeadline(data.bestDays, fundName)} />
              <MissingBestDaysChart bestDays={data.bestDays} fundName={fundName} />
              <BestDaysInCrashAnalysis bestDays={data.bestDays} fundName={fundName} />
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("all-time-highs") ? (
      <SectionShell
        id="all-time-highs"
        variant="stack"
        title="All-Time Highs"
        description="When the fund’s NAV reached fresh peaks — and how often that happens in a normal growth journey."
      >
        <ReportGroupBoundary state={risk} skeleton={<ChartSkeleton />}>
          {(data) => (
            <div className="space-y-4 sm:space-y-5">
              <SectionHeadline headline={buildAllTimeHighsHeadline(data.allTimeHighs, fundName)} />
              <AllTimeHighsChart allTimeHighs={data.allTimeHighs} fundName={fundName} />
              <AllTimeHighsYearTable allTimeHighs={data.allTimeHighs} fundName={fundName} />
              <PostAthReturnsTable
                postAthReturns={data.allTimeHighs.postAthReturns}
                periodLabel={data.allTimeHighs.periodLabel}
                fundName={fundName}
              />
              <AthDeclineOutlookChart allTimeHighs={data.allTimeHighs} fundName={fundName} />
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("expense") ? (
      <SectionShell id="expense" title="Expense Analysis">
        <ReportGroupBoundary state={investment} skeleton={<MetricGridSkeleton count={3} />}>
          {(data) =>
            data.expense.expenseRatio == null ? (
              <UnavailableNotice label="Expense ratio and category comparison" />
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <MetricTile label="Expense ratio" value={`${data.expense.expenseRatio}%`} />
                <MetricTile label="10Y cost on ₹1L" value={`₹${data.expense.costOver10Years?.toFixed(0)}`} />
                <MetricTile label="20Y cost on ₹1L" value={`₹${data.expense.costOver20Years?.toFixed(0)}`} />
              </div>
            )
          }
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender('peers') ? (
      <PeerSection
        scheme={scheme}
        category={category}
        peersSnapshot={peersSnapshot}
        isSharedView={isSharedView}
        onPeersLoaded={onPeersLoaded}
        enabled={peersActive}
      />
      ) : null}

      {shouldRender("quality") ? (
      <SectionShell
        id="quality"
        title="Fund Quality Score"
        description="Scored from known NAV metrics only — Standard Deviation and Beta Risk Level replace expense and diversification when those are unavailable."
      >
        <ReportGroupBoundary state={assessment} skeleton={<CardSkeleton />}>
          {(data) => (
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
                      className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-foreground"
                    >
                      <span>{c.name}</span>
                      <span className="font-mono text-base font-medium text-foreground">{c.score}/100</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("insights") ? (
      <SectionShell id="insights" title="AI Insights">
        <ReportGroupBoundary state={assessment} skeleton={<CardSkeleton />}>
          {(data) => (
            <>
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
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("verdict") ? (
      <SectionShell id="verdict" title="Final Recommendation">
        <ReportGroupBoundary state={assessment} skeleton={<CardSkeleton />}>
          {(data) => (
            <div className="flex flex-col items-center gap-4 text-center">
              <VerdictBadge
                verdict={data.recommendation.verdict}
                confidence={data.recommendation.confidencePercent}
              />
              <p className="max-w-2xl text-muted-foreground">{data.recommendation.summary}</p>
            </div>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}
    </div>
  )
}

function PeerSection({
  scheme,
  category,
  peersSnapshot = null,
  isSharedView = false,
  onPeersLoaded,
  enabled = true,
}: {
  scheme: string
  category: string
  peersSnapshot?: PeerComparison | null
  isSharedView?: boolean
  onPeersLoaded?: (peers: PeerComparison | null) => void
  enabled?: boolean
}) {
  const [peers, setPeers] = useState<PeerComparison | null>(isSharedView ? peersSnapshot : null)
  const [loading, setLoading] = useState(!isSharedView && enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    if (isSharedView) {
      setPeers(peersSnapshot)
      setLoading(false)
      setError(null)
      onPeersLoaded?.(peersSnapshot)
      return
    }

    if (!scheme) {
      setPeers(null)
      setLoading(false)
      setError(null)
      onPeersLoaded?.(null)
      return
    }

    const controller = new AbortController()
    setPeers(null)
    setError(null)
    setLoading(true)

    fetchPeerComparison(scheme, category || 'All', controller.signal)
      .then((data) => {
        setPeers(data)
        onPeersLoaded?.(data)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load peer comparison')
        onPeersLoaded?.(null)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [scheme, category, isSharedView, peersSnapshot, enabled, onPeersLoaded])

  return (
    <SectionShell
      id="peers"
      variant="stack"
      title="Peer Comparison"
      description="Top funds in the same category."
    >
      <PeerComparisonTable data={peers} loading={loading} error={error} />
    </SectionShell>
  )
}
