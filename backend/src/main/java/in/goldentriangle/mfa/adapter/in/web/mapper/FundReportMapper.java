package in.goldentriangle.mfa.adapter.in.web.mapper;

import in.goldentriangle.mfa.adapter.in.web.dto.BenchmarkComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ConsistencyDto;
import in.goldentriangle.mfa.adapter.in.web.dto.DrawdownReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ExpenseReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.FundProfileDto;
import in.goldentriangle.mfa.adapter.in.web.dto.FundReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.InvestorFitDto;
import in.goldentriangle.mfa.adapter.in.web.dto.LumpsumReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.MatrixReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.PeerComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ProbabilityDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ProsConsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.QualityScoreDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RecommendationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RiskReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RollingReturnsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.SipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.TaxReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.TrailingReturnsDto;
import in.goldentriangle.mfa.domain.model.report.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.DrawdownReport;
import in.goldentriangle.mfa.domain.model.report.ExpenseReport;
import in.goldentriangle.mfa.domain.model.report.FundProfile;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.InvestorFitReport;
import in.goldentriangle.mfa.domain.model.report.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.MatrixReportBundle;
import in.goldentriangle.mfa.domain.model.report.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.ProbabilityReport;
import in.goldentriangle.mfa.domain.model.report.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.QualityScoreReport;
import in.goldentriangle.mfa.domain.model.report.RecommendationReport;
import in.goldentriangle.mfa.domain.model.report.ReturnBand;
import in.goldentriangle.mfa.domain.model.report.RiskReport;
import in.goldentriangle.mfa.domain.model.report.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.SipReport;
import in.goldentriangle.mfa.domain.model.report.TaxReport;
import in.goldentriangle.mfa.domain.model.report.TrailingReturnsReport;
import org.springframework.stereotype.Component;

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
                toDto(report.benchmarkComparison()),
                toDto(report.probability()),
                toDto(report.risk()),
                toDto(report.consistency()),
                toDto(report.drawdown()),
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
                        p.percentAbove10(), p.percentAbove7(), p.percentNegative()))
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
                        .toList());
    }

    private SipReportDto toDto(SipReport report) {
        return new SipReportDto(report.scenarios().stream()
                .map(s -> new SipReportDto.SipScenarioDto(
                        s.monthlyAmount(), s.currentValue(), s.totalGain(), s.xirr(),
                        s.moneyInvested(), s.projectedValue10Y()))
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
                                r.selected()))
                        .toList(),
                report.highlights(),
                report.periodLabel());
    }
}
