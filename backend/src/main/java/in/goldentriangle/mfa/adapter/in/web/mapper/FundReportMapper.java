package in.goldentriangle.mfa.adapter.in.web.mapper;

import in.goldentriangle.mfa.domain.analytics.report.sip.Xirr;
import in.goldentriangle.mfa.domain.model.RiskLevel;
import in.goldentriangle.mfa.adapter.in.web.dto.report.CalendarYearInsightsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.AllTimeHighsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.BenchmarkComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.BestDaysReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ConsistencyDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.DrawdownPeersDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.DrawdownReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ExpenseReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.FundProfileDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportAssessmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.FundReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportInvestmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportOverviewDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportPerformanceDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportRiskDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.InvestorFitDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.LumpsumReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.MatrixReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.compare.PeerComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ProbabilityDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ProsConsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.QualityScoreDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RecommendationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.ReportSectionEnvelopeDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RiskReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RollingReturnsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SipSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SipTimelinePointDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.StepUpSipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.StepUpSipSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SwpSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SwpTimelinePointDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.TaxReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.TrailingReturnsDto;
import in.goldentriangle.mfa.domain.model.ReportSectionEnvelope;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarYearInsightsReport;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;
import in.goldentriangle.mfa.domain.model.report.returns.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.BestDaysReport;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownPeersReport;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownReport;
import in.goldentriangle.mfa.domain.model.report.investment.ExpenseReport;
import in.goldentriangle.mfa.domain.model.report.FundProfile;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;
import in.goldentriangle.mfa.domain.model.report.assessment.InvestorFitReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReportBundle;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.assessment.ProbabilityReport;
import in.goldentriangle.mfa.domain.model.report.assessment.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.QualityScoreReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RecommendationReport;
import in.goldentriangle.mfa.domain.model.report.matrix.ReturnBand;
import in.goldentriangle.mfa.domain.model.report.assessment.RiskReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipConfig;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipReport;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SwpReport;
import in.goldentriangle.mfa.domain.model.report.investment.SwpSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FundReportMapper {

    private final ApiMapper apiMapper;

    public FundReportMapper(ApiMapper apiMapper) {
        this.apiMapper = apiMapper;
    }

    public FundReportDto toDto(FundReport report) {
        return new FundReportDto(
                report.scheme(),
                toDto(report.profile()),
                apiMapper.toDto(report.goldenTriangle()),
                toDto(report.trailingReturns()),
                toDto(report.rollingReturns()),
                toDto(report.calendarYearInsights()),
                toDto(report.benchmarkComparison()),
                toDto(report.probability()),
                toDto(report.risk()),
                toDto(report.consistency()),
                toDto(report.drawdown()),
                toDto(report.bestDays()),
                toDto(report.allTimeHighs()),
                toDto(report.sip()),
                toDto(report.lumpsum()),
                toDto(report.tax()),
                toDto(report.expense()),
                toDto(report.qualityScore()),
                report.insights(),
                toDto(report.prosCons()),
                toDto(report.investorFit()),
                toDto(report.recommendation()),
                report.computedAt());
    }

    public MatrixReportDto toDto(MatrixReportBundle bundle) {
        MatrixReport report = bundle.matrix();
        return new MatrixReportDto(
                report.mode().name(),
                report.startLabels(),
                report.holdingYears(),
                report.summaryRows().stream()
                        .map(r -> new MatrixReportDto.MatrixRowDto(r.label(), r.values()))
                        .toList(),
                report.dataRows().stream()
                        .map(r -> new MatrixReportDto.MatrixDataRowDto(
                                r.startLabel(),
                                r.cells().stream()
                                        .map(c -> new MatrixReportDto.MatrixCellDto(
                                                c.holdingYears(),
                                                c.value(),
                                                c.band() == null ? null : c.band().name()))
                                        .toList()))
                        .toList(),
                toDto(bundle.recovery()),
                bundle.lastNavDate(),
                bundle.computedAt(),
                bundle.fromSnapshot());
    }

    private MatrixReportDto.MatrixRecoveryDto toDto(MatrixRecoveryAnalysis recovery) {
        return new MatrixReportDto.MatrixRecoveryDto(
                recovery.baselineHoldingYears(),
                recovery.strongReturnThreshold(),
                recovery.instancesBelowBaseline(),
                recovery.recoveredByExtension(),
                recovery.neverRecovered(),
                recovery.recoveryRatePercent(),
                recovery.maxExtensionYears(),
                recovery.rows().stream()
                        .map(r -> new MatrixReportDto.MatrixRecoveryDto.RecoveryRowDto(
                                r.startLabel(),
                                r.baselineReturn(),
                                r.recoveryHoldingYears(),
                                r.recoveryReturn(),
                                r.recovered(),
                                r.exception()))
                        .toList(),
                recovery.exceptionStartLabels(),
                recovery.headline(),
                recovery.summary());
    }

    public MatrixReportDto toDto(MatrixReport report) {
        return new MatrixReportDto(
                report.mode().name(),
                report.startLabels(),
                report.holdingYears(),
                report.summaryRows().stream()
                        .map(r -> new MatrixReportDto.MatrixRowDto(r.label(), r.values()))
                        .toList(),
                report.dataRows().stream()
                        .map(r -> new MatrixReportDto.MatrixDataRowDto(
                                r.startLabel(),
                                r.cells().stream()
                                        .map(c -> new MatrixReportDto.MatrixCellDto(
                                                c.holdingYears(),
                                                c.value(),
                                                c.band() == null ? null : c.band().name()))
                                        .toList()))
                        .toList(),
                null,
                null,
                null,
                false);
    }

    private FundProfileDto toDto(FundProfile profile) {
        return new FundProfileDto(
                profile.fundName(),
                profile.amc(),
                profile.category(),
                profile.benchmarkName(),
                profile.planType().orElse(null),
                profile.optionType().orElse(null),
                profile.launchDate().orElse(null),
                profile.fundAgeYears(),
                profile.fundManager().orElse(null),
                profile.expenseRatio().orElse(null),
                profile.exitLoad().orElse(null),
                profile.minimumInvestment().orElse(null),
                profile.aum().orElse(null),
                profile.latestNav(),
                profile.riskometer().orElse(null),
                profile.sebiRiskCategory().orElse(null),
                profile.overallRatingLabel(),
                profile.overallRatingStars(),
                profile.dataFrom(),
                profile.dataTo());
    }

    private TrailingReturnsDto toDto(TrailingReturnsReport report) {
        return new TrailingReturnsDto(report.periods().stream()
                .map(p -> new TrailingReturnsDto.PeriodReturnDto(
                        p.label(), p.absoluteReturn(), p.cagr(), p.growthOfTenThousand(), p.moneyMultiplied()))
                .toList());
    }

    private RollingReturnsReportDto toDto(RollingReturnsReport report) {
        return new RollingReturnsReportDto(report.periods().stream()
                .map(p -> new RollingReturnsReportDto.PeriodRollingStatsDto(
                        p.periodLabel(), p.average(), p.maximum(), p.minimum(), p.median(),
                        p.stdDev(), p.count(), p.percentAbove10(), p.percentAbove7(), p.percentNegative()))
                .toList(), report.consistencyScore());
    }

    private BenchmarkComparisonDto toDto(BenchmarkComparisonReport report) {
        return new BenchmarkComparisonDto(
                report.fundTotalReturn(), report.benchmarkTotalReturn(), report.difference(),
                report.outperformed(), report.outperformancePercent(), report.winningPercent(), report.explanation());
    }

    private ProbabilityDto toDto(ProbabilityReport report) {
        return new ProbabilityDto(
                report.positiveReturn(), report.beatInflation(), report.beatBenchmark(),
                report.above10Cagr(), report.doubleMoney(), report.tripleMoney());
    }

    private RiskReportDto toDto(RiskReport report) {
        return new RiskReportDto(
                report.volatility(), report.standardDeviation(), report.sharpeRatio(), report.sortinoRatio(),
                report.treynorRatio(), report.beta(), report.alpha(), report.rSquared(), report.maxDrawdown(),
                report.recoveryTimeYears(), report.downsideCapture(), report.upsideCapture(),
                report.informationRatio(), report.trackingError(), report.ulcerIndex(), report.calmarRatio(),
                report.valueAtRisk95(), report.riskLevel());
    }

    private ConsistencyDto toDto(ConsistencyReport report) {
        return new ConsistencyDto(
                report.calendarYears().stream()
                        .map(y -> new ConsistencyDto.CalendarYearDto(y.year(), y.returnPercent(), y.intraYearDrawdown()))
                        .toList(),
                report.monthlyHeatmap().stream()
                        .map(c -> new ConsistencyDto.HeatmapCellDto(c.year(), c.month(), c.returnPercent()))
                        .toList(),
                report.worstYear(), report.bestYear(), report.worstMonth(), report.bestMonth(),
                report.longestWinningStreak(), report.longestLosingStreak(), report.consistencyRating());
    }

    private DrawdownReportDto toDto(DrawdownReport report) {
        return new DrawdownReportDto(
                report.biggestCrash(), report.recoveryTimeYears(), report.maximumLoss(), report.averageRecoveryYears(),
                report.currentDrawdown(),
                report.series().stream()
                        .map(p -> new DrawdownReportDto.DrawdownPointDto(p.date(), p.drawdownPercent()))
                        .toList(),
                report.episodes().stream()
                        .map(e -> new DrawdownReportDto.DrawdownEpisodeDto(
                                e.peakDate(), e.troughDate(), e.recoveryDate(), e.fallPercent(), e.recoveryYears(),
                                e.recovered()))
                        .toList(),
                report.bearMarketDecades().stream()
                        .map(d -> new DrawdownReportDto.BearMarketDecadeDto(
                                d.decadeLabel(), d.percentOfDays(), d.daysInBearMarket(), d.totalDays(), d.partial()))
                        .toList(),
                report.thresholdRows().stream()
                        .map(r -> new DrawdownReportDto.DrawdownThresholdRowDto(
                                r.thresholdPercent(), r.fundPercentOfDays(), r.fundDaysBelow(),
                                r.benchmarkPercentOfDays()))
                        .toList(),
                report.phases().stream()
                        .map(p -> new DrawdownReportDto.DrawdownPhaseDto(
                                p.type(), p.startDate(), p.endDate(), p.changePercent(), p.durationLabel(),
                                p.durationYears(), p.ongoing()))
                        .toList(),
                report.indexedNav().stream()
                        .map(p -> new DrawdownReportDto.NavIndexPointDto(p.date(), p.indexValue()))
                        .toList());
    }

    private BestDaysReportDto toDto(BestDaysReport report) {
        return new BestDaysReportDto(
                report.initialInvestment(),
                report.periodLabel(),
                report.missingScenarios().stream()
                        .map(s -> new BestDaysReportDto.MissingBestDaysScenarioDto(
                                s.missCount(), s.label(), s.finalValue(), s.cagrPercent(), s.lowerByPercent()))
                        .toList(),
                report.topBestDays().stream()
                        .map(d -> new BestDaysReportDto.BestDayEntryDto(d.rank(), d.date(), d.returnPercent()))
                        .toList(),
                report.crashPeriods().stream()
                        .map(p -> new BestDaysReportDto.CrashPeriodBestDaysDto(
                                p.periodLabel(),
                                p.marketFallLabel(),
                                p.topDaysInPeriod(),
                                p.topRankLimit(),
                                p.bestDays().stream()
                                        .map(d -> new BestDaysReportDto.BestDayInPeriodDto(
                                                d.rank(), d.date(), d.returnPercent()))
                                        .toList()))
                        .toList(),
                report.topDaysCumulative().stream()
                        .map(c -> new BestDaysReportDto.TopDaysCumulativeDto(
                                c.topCount(), c.cumulativeReturnPercent()))
                        .toList(),
                new BestDaysReportDto.BestWorstProximityInsightDto(
                        report.proximityInsight().bestDaysNearWorst(),
                        report.proximityInsight().worstDaysConsidered(),
                        report.proximityInsight().topRankLimit(),
                        report.proximityInsight().exampleText()),
                report.headlineSummary());
    }

    private CalendarYearInsightsReportDto toDto(CalendarYearInsightsReport report) {
        return new CalendarYearInsightsReportDto(
                new CalendarYearInsightsReportDto.AnnualReturnDistributionDto(
                        report.distribution().buckets().stream()
                                .map(b -> new CalendarYearInsightsReportDto.ReturnBucketDto(
                                        b.label(), b.minInclusive(), b.maxExclusive(),
                                        b.percentOfYears(), b.yearCount()))
                                .toList(),
                        report.distribution().positiveYearsPercent(),
                        report.distribution().negativeYearsPercent(),
                        report.distribution().positiveYearCount(),
                        report.distribution().negativeYearCount(),
                        report.distribution().totalYears(),
                        report.distribution().headline()),
                new CalendarYearInsightsReportDto.SortedCalendarReturnsDto(
                        report.sortedReturns().periodLabel(),
                        report.sortedReturns().cagrPercent(),
                        report.sortedReturns().moneyMultiple(),
                        report.sortedReturns().longTermBandLow(),
                        report.sortedReturns().longTermBandHigh(),
                        report.sortedReturns().years().stream()
                                .map(y -> new CalendarYearInsightsReportDto.RankedYearReturnDto(
                                        y.year(), y.returnPercent(), y.inLongTermBand()))
                                .toList(),
                        report.sortedReturns().headline()),
                new CalendarYearInsightsReportDto.ProfitBookingComparisonDto(
                        report.profitBooking().rollingWindowYears(),
                        report.profitBooking().debtAnnualReturnPercent(),
                        report.profitBooking().rows().stream()
                                .map(r -> new CalendarYearInsightsReportDto.ProfitBookingRowDto(
                                        r.periodLabel(),
                                        r.startYear(),
                                        r.endYear(),
                                        r.buyHoldCagrPercent(),
                                        r.outperformanceAt20Percent(),
                                        r.outperformanceAt30Percent(),
                                        r.outperformanceAt50Percent(),
                                        r.outperformanceAtAllTimeHighPercent()))
                                .toList(),
                        report.profitBooking().headline(),
                        report.profitBooking().methodologyNote()));
    }

    private AllTimeHighsReportDto toDto(AllTimeHighsReport report) {
        return new AllTimeHighsReportDto(
                report.periodLabel(),
                report.series().stream()
                        .map(p -> new AllTimeHighsReportDto.NavPointDto(
                                p.date(), p.nav(), p.allTimeHigh(), p.fellBelowThreshold()))
                        .toList(),
                report.yearlyMaxLevels().stream()
                        .map(y -> new AllTimeHighsReportDto.YearlyMaxNavDto(
                                y.year(), y.yearLabel(), y.maxNav(), y.allTimeHighYear()))
                        .toList(),
                new AllTimeHighsReportDto.AllTimeHighsSummaryDto(
                        report.summary().totalAllTimeHighDays(),
                        report.summary().calendarYears(),
                        report.summary().yearsWithNewHigh(),
                        report.summary().yearsWithNewHighPercent(),
                        report.summary().headline()),
                new AllTimeHighsReportDto.PostAthReturnsDto(
                        report.postAthReturns().horizons().stream()
                                .map(h -> new AllTimeHighsReportDto.PostAthHorizonDto(
                                        h.label(),
                                        h.years(),
                                        h.sampleCount(),
                                        h.averageCagrPercent(),
                                        h.thresholds().stream()
                                                .map(t -> new AllTimeHighsReportDto.PostAthThresholdDto(
                                                        t.label(),
                                                        t.boundPercent(),
                                                        t.above(),
                                                        t.shareOfTimesPercent()))
                                                .toList()))
                                .toList(),
                        report.postAthReturns().headline()),
                new AllTimeHighsReportDto.AthDeclineOutlookDto(
                        report.athDeclineOutlook().declineThresholdPercent(),
                        report.athDeclineOutlook().totalAthInstances(),
                        report.athDeclineOutlook().neverFellCount(),
                        report.athDeclineOutlook().neverFellPercent(),
                        report.athDeclineOutlook().fellCount(),
                        report.athDeclineOutlook().fellPercent(),
                        report.athDeclineOutlook().headline()));
    }

    public DrawdownPeersDto toDto(DrawdownPeersReport report) {
        return new DrawdownPeersDto(
                report.thresholdRows().stream()
                        .map(r -> new DrawdownPeersDto.DrawdownThresholdRowDto(
                                r.thresholdPercent(), r.peerMedianPercentOfDays()))
                        .toList(),
                report.peerCount());
    }

    private SipReportDto toDto(SipReport report) {
        List<SipTimelinePointDto> timeline = report.timeline() == null
                ? List.of()
                : report.timeline().stream()
                        .map(p -> new SipTimelinePointDto(
                                p.date(), p.invested(), p.corpus(), p.nav(), p.averageCorpus()))
                        .toList();
        return new SipReportDto(
                report.scheduleDay(),
                report.chartAmount(),
                timeline,
                report.scenarios().stream()
                        .map(s -> new SipReportDto.SipScenarioDto(
                                s.monthlyAmount(), s.currentValue(), s.totalGain(), s.xirr(),
                                s.moneyInvested(), s.projectedValue10Y(), s.stcg(), s.ltcg(), s.postTaxXirr()))
                        .toList());
    }

    public SipSimulationDto toDto(SipSimulation simulation, int scheduleDay) {
        SipReport.SipScenario s = simulation.scenario();
        return new SipSimulationDto(
                scheduleDay,
                new SipReportDto.SipScenarioDto(
                        s.monthlyAmount(), s.currentValue(), s.totalGain(), s.xirr(),
                        s.moneyInvested(), s.projectedValue10Y(), s.stcg(), s.ltcg(), s.postTaxXirr()),
                simulation.timeline().stream()
                        .map(p -> new SipTimelinePointDto(
                                p.date(), p.invested(), p.corpus(), p.nav(), p.averageCorpus()))
                        .toList());
    }

    public SwpSimulationDto toDto(SwpSimulation simulation, int scheduleDay) {
        SwpReport.SwpScenario s = simulation.scenario();
        return new SwpSimulationDto(
                scheduleDay,
                new SwpSimulationDto.SwpScenarioDto(
                        s.initialCorpus(),
                        s.monthlyWithdrawal(),
                        s.totalWithdrawn(),
                        s.remainingCorpus(),
                        s.withdrawalCount(),
                        s.depleted(),
                        s.stcg(),
                        s.ltcg(),
                        s.postTaxRemaining()),
                simulation.timeline().stream()
                        .map(p -> new SwpTimelinePointDto(
                                p.date(), p.corpus(), p.withdrawn(), p.nav(), p.averageCorpus()))
                        .toList());
    }

    private StepUpSipReportDto toDto(StepUpSipReport report) {
        List<SipTimelinePointDto> timeline = report.timeline() == null
                ? List.of()
                : report.timeline().stream()
                        .map(p -> new SipTimelinePointDto(
                                p.date(), p.invested(), p.corpus(), p.nav(), p.averageCorpus()))
                        .toList();
        return new StepUpSipReportDto(
                report.scheduleDay(),
                report.chartInitialAmount(),
                report.stepUpMode().name(),
                report.stepUpPercent(),
                report.stepUpAmount(),
                timeline,
                report.scenarios().stream()
                        .map(s -> new StepUpSipReportDto.StepUpSipScenarioDto(
                                s.initialMonthlyAmount(),
                                s.currentMonthlyAmount(),
                                s.stepUpMode().name(),
                                s.stepUpValue(),
                                s.currentValue(),
                                s.totalGain(),
                                s.xirr(),
                                s.moneyInvested(),
                                s.projectedValue10Y(),
                                s.stcg(),
                                s.ltcg(),
                                s.postTaxXirr(),
                                s.instalmentCount()))
                        .toList());
    }

    public StepUpSipSimulationDto toDto(StepUpSipSimulation simulation, StepUpSipConfig config) {
        StepUpSipReport.StepUpSipScenario s = simulation.scenario();
        return new StepUpSipSimulationDto(
                config.scheduleDay(),
                config.mode().name(),
                config.stepUpPercent(),
                config.stepUpAmount(),
                new StepUpSipReportDto.StepUpSipScenarioDto(
                        s.initialMonthlyAmount(),
                        s.currentMonthlyAmount(),
                        s.stepUpMode().name(),
                        s.stepUpValue(),
                        s.currentValue(),
                        s.totalGain(),
                        s.xirr(),
                        s.moneyInvested(),
                        s.projectedValue10Y(),
                        s.stcg(),
                        s.ltcg(),
                        s.postTaxXirr(),
                        s.instalmentCount()),
                simulation.timeline().stream()
                        .map(p -> new SipTimelinePointDto(
                                p.date(), p.invested(), p.corpus(), p.nav(), p.averageCorpus()))
                        .toList());
    }

    private LumpsumReportDto toDto(LumpsumReport report) {
        return new LumpsumReportDto(report.scenarios().stream()
                .map(s -> new LumpsumReportDto.LumpsumScenarioDto(
                        s.principal(), s.currentValue(), s.gain(), s.cagr(), s.moneyMultiplied()))
                .toList());
    }

    private TaxReportDto toDto(TaxReport report) {
        return new TaxReportDto(
                report.stcg(), report.ltcg(), report.indexationBenefit(), report.postTaxReturn(), report.explanation());
    }

    private ExpenseReportDto toDto(ExpenseReport report) {
        return new ExpenseReportDto(
                report.expenseRatio(), report.costOver10Years(), report.costOver20Years(),
                report.categoryAverageExpense(), report.explanation());
    }

    private QualityScoreDto toDto(QualityScoreReport report) {
        return new QualityScoreDto(report.score(), report.components().stream()
                .map(c -> new QualityScoreDto.ComponentScoreDto(c.name(), c.score(), c.weight()))
                .toList());
    }

    private ProsConsDto toDto(ProsConsReport report) {
        return new ProsConsDto(report.pros(), report.cons());
    }

    private InvestorFitDto toDto(InvestorFitReport report) {
        return new InvestorFitDto(report.suitableFor(), report.notSuitableFor());
    }

    private RecommendationDto toDto(RecommendationReport report) {
        return new RecommendationDto(report.verdict(), report.confidencePercent(), report.summary());
    }

    public PeerComparisonDto toDto(in.goldentriangle.mfa.domain.model.report.PeerComparisonReport report) {
        return new PeerComparisonDto(
                report.peers().stream()
                        .map(r -> new PeerComparisonDto.PeerRowDto(
                                r.scheme(),
                                r.average(),
                                r.maximum(),
                                r.minimum(),
                                r.stdDev(),
                                r.cob(),
                                r.totalRecords(),
                                r.sharpe(),
                                r.maxDrawdown(),
                                r.consistencyScore(),
                                r.selected(),
                                r.horizonReturns().stream()
                                        .map(h -> new PeerComparisonDto.HorizonReturnDto(
                                                h.label(), h.cagrPercent(), h.moneyMultiplied()))
                                        .toList()))
                        .toList(),
                report.highlights(),
                report.periodLabel(),
                new PeerComparisonDto.LongRunAnalysisDto(
                        report.longRunAnalysis().categoryLabel(),
                        report.longRunAnalysis().asOfDate(),
                        report.longRunAnalysis().horizonLabels(),
                        report.longRunAnalysis().twentyYearCagrLow(),
                        report.longRunAnalysis().twentyYearCagrHigh(),
                        report.longRunAnalysis().twentyYearMultiplyLow(),
                        report.longRunAnalysis().twentyYearMultiplyHigh()));
    }

    public FundReportOverviewDto toDto(FundReportOverviewSection section) {
        return new FundReportOverviewDto(section.scheme(), toDto(section.profile()));
    }

    public FundReportPerformanceDto toDto(FundReportPerformanceSection section) {
        return new FundReportPerformanceDto(
                toDto(section.trailingReturns()),
                toDto(section.rollingReturns()),
                toDto(section.calendarYearInsights()),
                toDto(section.benchmarkComparison()),
                toDto(section.probability()));
    }

    public FundReportRiskDto toDto(FundReportRiskSection section) {
        return new FundReportRiskDto(
                toDto(section.risk()),
                toDto(section.consistency()),
                toDto(section.drawdown()),
                toDto(section.bestDays()),
                toDto(section.allTimeHighs()));
    }

    public FundReportInvestmentDto toDto(FundReportInvestmentSection section) {
        return new FundReportInvestmentDto(
                toDto(section.sip()),
                toDto(section.stepUpSip()),
                toDto(section.lumpsum()),
                toDto(section.tax()),
                toDto(section.expense()));
    }

    public FundReportAssessmentDto toDto(FundReportAssessmentSection section) {
        return new FundReportAssessmentDto(
                apiMapper.toDto(section.goldenTriangle()),
                toDto(section.qualityScore()),
                section.insights(),
                toDto(section.prosCons()),
                toDto(section.investorFit()),
                toDto(section.recommendation()));
    }

    public <T, D> ReportSectionEnvelopeDto<D> toDto(ReportSectionEnvelope<T> envelope, java.util.function.Function<T, D> mapper) {
        return new ReportSectionEnvelopeDto<>(
                mapper.apply(envelope.data()),
                envelope.freshness().name(),
                envelope.watermarkNavDate(),
                envelope.computedAt(),
                envelope.schemaVersion());
    }

    public ReportSectionEnvelopeDto<FundReportOverviewDto> toOverviewDto(
            ReportSectionEnvelope<FundReportOverviewSection> envelope) {
        return toDto(envelope, this::toDto);
    }

    public ReportSectionEnvelopeDto<FundReportPerformanceDto> toPerformanceDto(
            ReportSectionEnvelope<FundReportPerformanceSection> envelope) {
        return toDto(envelope, this::toDto);
    }

    public ReportSectionEnvelopeDto<FundReportRiskDto> toRiskDto(
            ReportSectionEnvelope<FundReportRiskSection> envelope) {
        return toDto(envelope, this::toDto);
    }

    public ReportSectionEnvelopeDto<FundReportInvestmentDto> toInvestmentDto(
            ReportSectionEnvelope<FundReportInvestmentSection> envelope) {
        return toDto(envelope, this::toDto);
    }

    public ReportSectionEnvelopeDto<FundReportAssessmentDto> toAssessmentDto(
            ReportSectionEnvelope<FundReportAssessmentSection> envelope) {
        return toDto(envelope, this::toDto);
    }
}
