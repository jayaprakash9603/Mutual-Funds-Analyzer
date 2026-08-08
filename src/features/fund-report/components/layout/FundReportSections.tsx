import { useEffect, useMemo, useState } from 'react'
import { GoldenTriangleResultCard } from '@/components/dashboard/cards/GoldenTriangleResultCard'
import { InsightsPanel } from '@/components/dashboard/widgets/InsightsPanel'
import { FundRollingReturnsTable } from '@/components/fundsindia/FundRollingReturnsTable'
import { Badge } from '@/components/ui/badge'
import { AppMetricGrid } from '@/components/ui/AppMetricGrid'
import { formatPercent, cn } from '@/lib/utils'
import { appHighlightCard } from '@/lib/ui/appCardStyles'
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
  buildVolatilityHeadline,
} from '../../lib/headlines/sectionHeadlines'
import {
  BearMarketDecadeChart,
  hasDecadeHistory,
} from '../charts/BearMarketDecadeChart'
import { AnnotatedDrawdownChart } from '../charts/AnnotatedDrawdownChart'
import { DeclineRecoveryChart } from '../charts/DeclineRecoveryChart'
import { FundReportReturnsChart } from '../charts/FundReportReturnsChart'
import { FundAnnualReturnsChart } from '../charts/FundAnnualReturnsChart'
import { FundBenchmarkAnalysisCharts } from '../charts/FundBenchmarkAnalysisCharts'
import { FundGrowthTrendChart } from '../charts/FundGrowthTrendChart'
import { FundRollingTrendChart } from '../charts/FundRollingTrendChart'
import { PerformanceTimelinePanel } from '../charts/PerformanceTimelinePanel'
import { RollingReturnDistributionChart } from '../charts/RollingReturnDistributionChart'
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
import { ReturnDistributionHistogram } from '../charts/ReturnDistributionHistogram'
import { RollingVolatilityChart } from '../charts/RollingVolatilityChart'
import { VolatilitySwingChart } from '../charts/VolatilitySwingChart'
import { SortedCalendarReturnsChart } from '../charts/SortedCalendarReturnsChart'
import { ProfitBookingComparisonTable } from '../charts/ProfitBookingComparisonTable'
import { DrawdownEpisodesTable } from '../tables/DrawdownEpisodesTable'
import { DrawdownThresholdTable } from '../tables/DrawdownThresholdTable'
import { MultiplyProbabilityTable } from '../tables/MultiplyProbabilityTable'
import { PeerComparisonTable } from '../tables/PeerComparisonTable'
import { ProbabilityBar } from '../charts/ReportVisuals'
import {
  CardSkeleton,
  ChartSkeleton,
  MetricGridSkeleton,
  ReportGroupBoundary,
  TableSkeleton,
} from './ReportGroupBoundary'
import { MetricTile, SectionShell } from './SectionShell'
import { RiskAnalysisPanel } from './RiskAnalysisPanel'
import { TrailingReturnsTable } from '../tables/TrailingReturnsTable'
import { GoalPlannerSection } from '../goals/GoalPlannerSection'
import { LumpsumSection } from '../investment/LumpsumSection'
import { SipSection, StepUpSipSection, StpSection, SwpSection } from '../investment/InvestmentStrategySections'
import { VolatilityFrequencyTable } from '../tables/VolatilityFrequencyTable'
import {
  describeFluctuation,
  describeTrend,
  describeVsBenchmark,
  describeWorstMove,
  getDailyPeriod,
} from '../../lib/volatility/volatilityInsights'
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
    <div id={exportRootId} className="space-y-6 sm:space-y-8">
      {exportTitle ? (
        <div className={appHighlightCard}>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">{exportTitle}</h2>
          <p className="text-[10px] text-muted-foreground sm:text-xs">Fund report snapshot</p>
        </div>
      ) : null}
      {shouldRender("overview") ? (
      <SectionShell id="overview" title="Fund Overview" description="Key fund facts and quick rating.">
        <ReportGroupBoundary state={overview} skeleton={<MetricGridSkeleton count={8} />}>
          {(data) => (
            <div className="space-y-3 sm:space-y-4">
              {/* Own card on phones (SectionShell stacks); transparent inside desktop section card. */}
              <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                <AppMetricGrid>
                  <MetricTile label="Fund" value={data.profile.fundName} valueVariant="text" />
                  <MetricTile label="AMC" value={data.profile.amc || '—'} valueVariant="text" />
                  <MetricTile label="Category" value={data.profile.category || '—'} valueVariant="text" />
                  <MetricTile label="Benchmark" value={data.profile.benchmarkName} valueVariant="text" />
                  <MetricTile label="NAV" value={`₹${data.profile.latestNav.toFixed(2)}`} />
                  <MetricTile label="Fund Age" value={`${data.profile.fundAgeYears.toFixed(1)} yrs`} valueVariant="text" />
                  <MetricTile label="Rating" value={`${stars} ${data.profile.overallRatingLabel}`} valueVariant="text" />
                  <MetricTile
                    label="Data Range"
                    value={`${data.profile.dataFrom.slice(0, 10)} → ${data.profile.dataTo.slice(0, 10)}`}
                    valueVariant="text"
                  />
                </AppMetricGrid>
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
        <ReportInsightCard
          title="Absolute returns"
          subtitle="Pick a window below to see how ₹10,000 in this fund would have grown — fund only, no benchmark."
        >
          <FundGrowthTrendChart
            fundName={fundName}
            indexedNav={risk.data?.drawdown.indexedNav ?? []}
            loading={risk.loading && risk.data == null}
          />
        </ReportInsightCard>
        {scheme ? (
          <FundAnnualReturnsChart
            scheme={scheme}
            fundName={fundName}
            benchmarkName={benchmarkName}
            startDate={startDate}
            offlineView={isSharedView}
          />
        ) : null}
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
        {scheme ? (
          <>
            <ReportInsightCard
              title="Rolling return trend"
              subtitle="Pick a rolling window below to see every window this fund has completed — fund only, no benchmark."
            >
              <FundRollingTrendChart
                scheme={scheme}
                fundName={fundName}
                startDate={startDate}
                offlineView={isSharedView}
              />
            </ReportInsightCard>
            <RollingReturnDistributionChart
              scheme={scheme}
              fundName={fundName}
              startDate={startDate}
              offlineView={isSharedView}
            />
          </>
        ) : null}
      </SectionShell>
      ) : null}

      {shouldRender("performance-timeline") ? (
      <SectionShell
        id="performance-timeline"
        variant="stack"
        title="Performance Timeline"
        description="Historical checkpoints across rolling return windows — inception, peak, trough, midpoint, and latest — with fund vs benchmark alpha and Golden Triangle context."
      >
        {scheme ? (
          <PerformanceTimelinePanel
            scheme={scheme}
            fundName={fundName}
            benchmarkName={benchmarkName}
            startDate={startDate}
            offlineView={isSharedView}
          />
        ) : null}
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
        variant="stack"
        description="Fund vs benchmark key parameters, rolling returns, and cumulative growth."
      >
        <ReportGroupBoundary state={performance} skeleton={<MetricGridSkeleton count={3} />}>
          {(data) => (
            <div className={cn(appHighlightCard, 'space-y-3 sm:space-y-4')}>
              <SectionHeadline
                headline={buildBenchmarkHeadline(
                  data.benchmarkComparison,
                  fundName,
                  benchmarkName,
                )}
              />
              <AppMetricGrid variant="compact">
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
              </AppMetricGrid>
              <p className="text-xs text-muted-foreground sm:text-sm">{data.benchmarkComparison.explanation}</p>
            </div>
          )}
        </ReportGroupBoundary>
        {scheme ? (
          <FundBenchmarkAnalysisCharts
            scheme={scheme}
            fundName={fundName}
            benchmarkName={benchmarkName}
            startDate={startDate}
            offlineView={isSharedView}
          />
        ) : null}
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
              <AppMetricGrid className="mb-6 lg:grid-cols-2">
                <ProbabilityBar label="Positive return" value={data.probability.positiveReturn} />
                <ProbabilityBar label="Beat inflation (~7%)" value={data.probability.beatInflation} />
                <ProbabilityBar label="Beat benchmark" value={data.probability.beatBenchmark} />
                <ProbabilityBar label="&gt;10% CAGR" value={data.probability.above10Cagr} />
                <ProbabilityBar label="Double money (7Y)" value={data.probability.doubleMoney} />
                <ProbabilityBar label="Triple money (7Y)" value={data.probability.tripleMoney} />
              </AppMetricGrid>
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
      <SectionShell
        id="risk"
        title="Risk Analysis"
        variant="stack"
        description="Core risk metrics, quality scores, and the final buy/hold verdict — everything you need to judge how this fund handles stress."
      >
        <ReportGroupBoundary state={risk} skeleton={<MetricGridSkeleton count={4} />}>
          {(riskData) => (
            <ReportGroupBoundary state={assessment} skeleton={<CardSkeleton />}>
              {(assessmentData) => (
                <RiskAnalysisPanel
                  risk={riskData}
                  assessment={assessmentData}
                  fundName={fundName}
                />
              )}
            </ReportGroupBoundary>
          )}
        </ReportGroupBoundary>
      </SectionShell>
      ) : null}

      {shouldRender("volatility") ? (
      <SectionShell
        id="volatility"
        title="Volatility"
        variant="stack"
        description="How much this fund's value swings from day to day, week to week, and month to month."
      >
        <ReportGroupBoundary state={risk} skeleton={<ChartSkeleton />}>
          {(data) => {
            const daily = getDailyPeriod(data.volatility)
            return (
              <>
                <SectionHeadline headline={buildVolatilityHeadline(data.volatility, fundName)} />
                {daily ? (
                  <AppMetricGrid>
                    <MetricTile
                      label="Annualised volatility"
                      value={formatPercent(daily.annualisedVolatilityPercent, 1)}
                      metricKey="volatility"
                    />
                    <MetricTile
                      label="Typical daily swing"
                      value={formatPercent(daily.typicalSwingPercent, 2)}
                      metricKey="typicalSwing"
                    />
                    <MetricTile
                      label="Worst day"
                      value={formatPercent(daily.worstReturnPercent, 1)}
                      metricKey="worstDay"
                    />
                    <MetricTile
                      label="Best day"
                      value={formatPercent(daily.bestReturnPercent, 1)}
                      metricKey="bestDay"
                    />
                  </AppMetricGrid>
                ) : null}

                <div className="grid gap-3">
                  {describeFluctuation(data.volatility) ? (
                    <p className="text-sm text-muted-foreground">{describeFluctuation(data.volatility)}</p>
                  ) : null}
                  {describeWorstMove(data.volatility) ? (
                    <p className="text-sm text-muted-foreground">{describeWorstMove(data.volatility)}</p>
                  ) : null}
                  {describeVsBenchmark(data.volatility) ? (
                    <p className="text-sm text-muted-foreground">{describeVsBenchmark(data.volatility)}</p>
                  ) : null}
                  {describeTrend(data.volatility) ? (
                    <p className="text-sm text-muted-foreground">{describeTrend(data.volatility)}</p>
                  ) : null}
                </div>

                <ReportInsightCard
                  title="Is the ride getting bumpier?"
                  subtitle="Rolling 1-year annualised volatility over time"
                >
                  <RollingVolatilityChart
                    volatility={data.volatility}
                    fundName={fundName}
                    benchmarkName={overview.data?.profile.benchmarkName}
                  />
                </ReportInsightCard>

                <ReportInsightCard title="Volatility by time frame">
                  <VolatilityFrequencyTable
                    volatility={data.volatility}
                    benchmarkName={overview.data?.profile.benchmarkName || 'Benchmark'}
                  />
                </ReportInsightCard>

                <ReportInsightCard title="Biggest single moves">
                  <VolatilitySwingChart volatility={data.volatility} />
                </ReportInsightCard>

                <ReportInsightCard title="How often do big swings happen?">
                  <ReturnDistributionHistogram volatility={data.volatility} />
                </ReportInsightCard>
              </>
            )
          }}
        </ReportGroupBoundary>
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
              <AppMetricGrid variant="wide" className="mb-4">
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
              </AppMetricGrid>
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
