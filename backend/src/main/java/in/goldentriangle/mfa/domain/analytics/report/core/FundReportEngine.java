package in.goldentriangle.mfa.domain.analytics.report.core;

import in.goldentriangle.mfa.domain.analytics.report.drawdown.DrawdownCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.MatrixCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.ProbabilityCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.RollingBandCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarYearInsightsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.AllTimeHighsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.BestDaysCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.LumpsumCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.SipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.ExpenseCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.OverallRating;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import in.goldentriangle.mfa.domain.analytics.RollingReturnFilters;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarYearInsightsReport;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;
import in.goldentriangle.mfa.domain.model.report.returns.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.BestDaysReport;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownReport;
import in.goldentriangle.mfa.domain.model.report.investment.ExpenseReport;
import in.goldentriangle.mfa.domain.model.report.FundMetadata;
import in.goldentriangle.mfa.domain.model.report.FundProfile;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.assessment.InvestorFitReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.assessment.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.QualityScoreReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RecommendationReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public class FundReportEngine {

    private final GoldenTriangleEvaluator goldenTriangleEvaluator;
    private final TrailingReturnsCalculator trailingReturnsCalculator;
    private final RollingBandCalculator rollingBandCalculator;
    private final DrawdownCalculator drawdownCalculator;
    private final BestDaysCalculator bestDaysCalculator;
    private final AllTimeHighsCalculator allTimeHighsCalculator;
    private final CalendarYearInsightsCalculator calendarYearInsightsCalculator;
    private final ProbabilityCalculator probabilityCalculator;
    private final RiskReportBuilder riskReportBuilder;
    private final SipCalculator sipCalculator;
    private final LumpsumCalculator lumpsumCalculator;
    private final TaxCalculator taxCalculator;
    private final ExpenseCalculator expenseCalculator;
    private final QualityScoreCalculator qualityScoreCalculator;
    private final VerdictEngine verdictEngine;
    private final MatrixCalculator matrixCalculator;

    public FundReportEngine(
            GoldenTriangleEvaluator goldenTriangleEvaluator,
            TrailingReturnsCalculator trailingReturnsCalculator,
            RollingBandCalculator rollingBandCalculator,
            DrawdownCalculator drawdownCalculator,
            BestDaysCalculator bestDaysCalculator,
            AllTimeHighsCalculator allTimeHighsCalculator,
            CalendarYearInsightsCalculator calendarYearInsightsCalculator,
            ProbabilityCalculator probabilityCalculator,
            RiskReportBuilder riskReportBuilder,
            SipCalculator sipCalculator,
            LumpsumCalculator lumpsumCalculator,
            TaxCalculator taxCalculator,
            ExpenseCalculator expenseCalculator,
            QualityScoreCalculator qualityScoreCalculator,
            VerdictEngine verdictEngine,
            MatrixCalculator matrixCalculator) {
        this.goldenTriangleEvaluator = goldenTriangleEvaluator;
        this.trailingReturnsCalculator = trailingReturnsCalculator;
        this.rollingBandCalculator = rollingBandCalculator;
        this.drawdownCalculator = drawdownCalculator;
        this.bestDaysCalculator = bestDaysCalculator;
        this.allTimeHighsCalculator = allTimeHighsCalculator;
        this.calendarYearInsightsCalculator = calendarYearInsightsCalculator;
        this.probabilityCalculator = probabilityCalculator;
        this.riskReportBuilder = riskReportBuilder;
        this.sipCalculator = sipCalculator;
        this.lumpsumCalculator = lumpsumCalculator;
        this.taxCalculator = taxCalculator;
        this.expenseCalculator = expenseCalculator;
        this.qualityScoreCalculator = qualityScoreCalculator;
        this.verdictEngine = verdictEngine;
        this.matrixCalculator = matrixCalculator;
    }

    public FundReport build(
            NavHistory history,
            RollingReturnsData rollingData,
            Optional<FundMetadata> metadata,
            Instant computedAt) {
        String periodLabel = Period.Labels.FIVE_YEAR;
        List<RollingReturnRow> fundPeriod = RollingReturnFilters.byPeriod(rollingData.fund(), periodLabel);
        List<RollingReturnRow> benchmarkPeriod = RollingReturnFilters.byPeriod(rollingData.benchmark(), periodLabel);
        AnalysisInput input = new AnalysisInput(
                fundPeriod.isEmpty() ? rollingData.fund() : fundPeriod,
                benchmarkPeriod.isEmpty() ? rollingData.benchmark() : benchmarkPeriod,
                periodLabel);
        GoldenTriangleResult goldenTriangle = goldenTriangleEvaluator.evaluate(input);
        FundMetrics metrics = goldenTriangle.metrics();

        FundProfile profile = buildProfile(history, metadata, goldenTriangle, metrics);
        TrailingReturnsReport trailing = trailingReturnsCalculator.compute(history);
        RollingReturnsReport rolling = rollingBandCalculator.compute(rollingData, metrics.consistencyScore());
        BenchmarkComparisonReport benchmark = buildBenchmark(metrics, rollingBandCalculator.winningPercent(rollingData));
        DrawdownReport drawdown = drawdownCalculator.compute(history.fundNav(), history.benchmarkNav());
        BestDaysReport bestDays = bestDaysCalculator.compute(history.fundNav());
        AllTimeHighsReport allTimeHighs = allTimeHighsCalculator.compute(history.fundNav());
        ConsistencyReport consistency = drawdownCalculator.calendarYears(history.fundNav());
        CalendarYearInsightsReport calendarYearInsights =
                calendarYearInsightsCalculator.compute(history.fundNav(), consistency);
        SipReport sip = sipCalculator.compute(history);
        LumpsumReport lumpsum = lumpsumCalculator.compute(history);
        TaxReport tax = taxCalculator.compute(metrics.totalReturn(), metrics.fundAgeYears(), 100_000);
        ExpenseReport expense = expenseCalculator.compute(
                metadata.flatMap(m -> Optional.of(m.expenseRatio())),
                100_000,
                metrics.fundAnnReturn());
        QualityScoreReport quality = qualityScoreCalculator.compute(metrics);
        List<String> insights = goldenTriangleEvaluator.generateInsights(goldenTriangle);
        ProsConsReport prosCons = verdictEngine.prosCons(goldenTriangle, metrics);
        InvestorFitReport investorFit = verdictEngine.investorFit(goldenTriangle, metrics);
        RecommendationReport recommendation = verdictEngine.recommend(goldenTriangle, metrics, quality.score());

        return new FundReport(
                history.scheme(),
                profile,
                goldenTriangle,
                trailing,
                rolling,
                calendarYearInsights,
                benchmark,
                probabilityCalculator.compute(rollingData),
                riskReportBuilder.build(rollingData, periodLabel, metrics, drawdown),
                consistency,
                drawdown,
                bestDays,
                allTimeHighs,
                sip,
                lumpsum,
                tax,
                expense,
                quality,
                insights,
                prosCons,
                investorFit,
                recommendation,
                computedAt);
    }

    public MatrixReport buildMatrix(NavHistory history, MatrixMode mode) {
        return matrixCalculator.compute(history, mode);
    }

    private FundProfile buildProfile(
            NavHistory history,
            Optional<FundMetadata> metadata,
            GoldenTriangleResult goldenTriangle,
            FundMetrics metrics) {
        double latestNav = history.fundNav().isEmpty() ? 0
                : history.fundNav().get(history.fundNav().size() - 1).nav();
        int stars = goldenTriangle.passCount() + 2;

        return new FundProfile(
                history.fundName(),
                history.amc(),
                history.category(),
                history.benchmarkName(),
                metadata.map(FundMetadata::planType),
                metadata.map(FundMetadata::optionType),
                metadata.map(FundMetadata::launchDate),
                metrics.fundAgeYears(),
                metadata.map(FundMetadata::fundManager),
                metadata.map(FundMetadata::expenseRatio),
                metadata.map(FundMetadata::exitLoad),
                metadata.map(FundMetadata::minimumInvestment),
                metadata.map(FundMetadata::aum),
                latestNav,
                metadata.map(FundMetadata::riskometer),
                metadata.map(FundMetadata::sebiRiskCategory),
                goldenTriangle.overallRating().displayLabel(),
                Math.min(5, stars),
                history.firstNavDate(),
                history.lastNavDate());
    }

    private BenchmarkComparisonReport buildBenchmark(FundMetrics metrics, double winningPercent) {
        double diff = metrics.totalReturn() - metrics.benchmarkTotalReturn();
        return new BenchmarkComparisonReport(
                metrics.totalReturn(),
                metrics.benchmarkTotalReturn(),
                diff,
                diff > 0,
                diff,
                winningPercent,
                diff > 0
                        ? "Fund outperformed benchmark over the analysis period."
                        : "Fund underperformed benchmark over the analysis period.");
    }
}
