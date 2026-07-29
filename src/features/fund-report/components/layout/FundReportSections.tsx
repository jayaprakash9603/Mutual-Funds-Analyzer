import { useEffect, useMemo, useState } from 'react'
import { GoldenTriangleResultCard } from '@/components/dashboard/cards/GoldenTriangleResultCard'
import { FinalRecommendationPanel } from '@/features/fund-report/components/layout/FinalRecommendationPanel'
import { InsightsPanel } from '@/components/dashboard/widgets/InsightsPanel'
import { FundRollingReturnsTable } from '@/components/fundsindia/FundRollingReturnsTable'
import { Badge } from '@/components/ui/badge'
import { formatPercent } from '@/lib/utils'
import type { GoldenTriangleResult } from '@/api/schemas'
import { fetchPeerComparison } from '../../api'
import type { ProgressiveFundReportGroups } from '../../hooks/useProgressiveFundReport'
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
  buildProbabilityHeadline,
  buildRollingReturnsHeadline,
  buildSortedReturnsHeadline,
  buildTrailingReturnsHeadline,
} from '../../lib/headlines/sectionHeadlines'
import {
  BearMarketDecadeChart,
  hasDecadeHistory,
} from '../charts/BearMarketDecadeChart'
import { AnnotatedDrawdownChart } from '../charts/AnnotatedDrawdownChart'
import { DeclineRecoveryChart } from '../charts/DeclineRecoveryChart'
import { FundReportReturnsChart } from '../charts/FundReportReturnsChart'
import { FundBenchmarkAnalysisCharts } from '../charts/FundBenchmarkAnalysisCharts'
import { FundLongTermStoryChart } from '../charts/FundLongTermStoryChart'
import { MissingBestDaysChart } from '../charts/MissingBestDaysChart'
import { MissingBestQuarterChart } from '../charts/MissingBestQuarterChart'
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
import { MultiplyProbabilityTable } from '../tables/MultiplyProbabilityTable'
import { PeerComparisonTable } from '../tables/PeerComparisonTable'
import { GaugeMeter, ProbabilityBar } from '../charts/ReportVisuals'
import {
  CardSkeleton,
  ChartSkeleton,
  MetricGridSkeleton,
  ReportGroupBoundary,
  TableSkeleton,
} from './ReportGroupBoundary'
import { MetricTile, SectionShell, UnavailableNotice } from './SectionShell'
import { TrailingReturnsTable } from '../tables/TrailingReturnsTable'
import { GoalPlannerSection } from '../goals/GoalPlannerSection'
import { LumpsumSection } from '../investment/LumpsumSection'
import { SipSection, StepUpSipSection, StpSection, SwpSection } from '../investment/InvestmentStrategySections'
import { fromMultiplyOdds } from '../../lib/matrix/multiplyProbability'
import { sectionNeedsPeersFetch } from '../../lib/nav/reportSectionRequirements'

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
  startDate?: string
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
  startDate,
}: FundReportSectionsProps) {
  const peersActive = renderAll || sectionNeedsPeersFetch(activeSection)

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
            <>
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
              <FundLongTermStoryChart
                fundName={data.profile.fundName}
                category={data.profile.category}
                fundAgeYears={data.profile.fundAgeYears}
                latestNav={data.profile.latestNav}
                dataTo={data.profile.dataTo}
                indexedNav={risk.data?.drawdown.indexedNav ?? []}
                loading={risk.loading && (risk.data?.drawdown.indexedNav?.length ?? 0) === 0}
              />
            </>
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
      <SectionShell
        id="benchmark"
        title="Benchmark Comparison"
        description="Fund vs benchmark cumulative growth and rolling-window returns."
      >
        {scheme ? (
          <div className="mb-6">
            <FundBenchmarkAnalysisCharts
              scheme={scheme}
              startDate={startDate}
              offlineView={isSharedView}
            />
          </div>
        ) : null}
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
              {data.multiplyOdds.holdingYears.length > 0 ? (
                <MultiplyProbabilityTable
                  table={fromMultiplyOdds(data.multiplyOdds)}
                  fundName={fundName}
                  benchmarkName={benchmarkName}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Need at least 5 years of history to show multiply probability.
                </p>
              )}
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

      {shouldRender('lumpsum') ? (
        <LumpsumSection
          scheme={scheme}
          investment={investment}
          startDate={startDate}
          isSharedView={isSharedView}
        />
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
              <AnnotatedDrawdownChart drawdown={data.drawdown} fundName={fundName} />
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
        title="Best Days & Best Quarter"
        description="Return lost from missing the best trading days or the best quarter in rolling three-year windows."
      >
        <ReportGroupBoundary state={risk} skeleton={<ChartSkeleton />}>
          {(data) => (
            <div className="space-y-4 sm:space-y-5">
              <SectionHeadline headline={buildBestDaysHeadline(data.bestDays, fundName)} />
              <MissingBestDaysChart bestDays={data.bestDays} fundName={fundName} />
              <BestDaysInCrashAnalysis bestDays={data.bestDays} fundName={fundName} />
              {data.missingBestQuarter.series.length > 0 ? (
                <MissingBestQuarterChart
                  missingBestQuarter={data.missingBestQuarter}
                  fundName={fundName}
                />
              ) : null}
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

      {shouldRender('sip') ? (
        <SipSection
          scheme={scheme}
          investment={investment}
          startDate={startDate}
          isSharedView={isSharedView}
        />
      ) : null}

      {shouldRender('step-up-sip') ? (
        <StepUpSipSection
          scheme={scheme}
          investment={investment}
          startDate={startDate}
          isSharedView={isSharedView}
        />
      ) : null}

      {shouldRender('goal-planner') ? (
        <ReportGroupBoundary state={performance} skeleton={<ChartSkeleton />}>
          {(data) => <GoalPlannerSection performance={data} />}
        </ReportGroupBoundary>
      ) : null}

      {shouldRender('stp') ? (
        <StpSection scheme={scheme} startDate={startDate} isSharedView={isSharedView} />
      ) : null}

      {shouldRender('swp') ? (
        <SwpSection scheme={scheme} startDate={startDate} isSharedView={isSharedView} />
      ) : null}

      {shouldRender('peers') ? (
      <PeerSection
        scheme={scheme}
        category={category}
        navAsOf={dataTo}
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
          {(data) => <FinalRecommendationPanel assessment={data} />}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}
    </div>
  )
}

function PeerSection({
  scheme,
  category,
  navAsOf,
  peersSnapshot = null,
  isSharedView = false,
  onPeersLoaded,
  enabled = true,
}: {
  scheme: string
  category: string
  navAsOf?: string
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
  }, [scheme, category, navAsOf, isSharedView, peersSnapshot, enabled, onPeersLoaded])

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
