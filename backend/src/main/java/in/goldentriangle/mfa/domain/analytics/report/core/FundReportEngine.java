package in.goldentriangle.mfa.domain.analytics.report.core;

import in.goldentriangle.mfa.config.metrics.ReportComputeMetrics;
import in.goldentriangle.mfa.domain.analytics.report.drawdown.DrawdownCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.MatrixCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.MultiplyOddsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.ProbabilityCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.RollingBandCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarYearInsightsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.AllTimeHighsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.BestDaysCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.MissingBestQuarterCalculator;
import in.goldentriangle.mfa.domain.analytics.report.risk.VolatilityCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.LumpsumCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.StepUpSipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.ExpenseCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
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
import in.goldentriangle.mfa.domain.model.report.assessment.ProbabilityReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.assessment.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.QualityScoreReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RecommendationReport;
import in.goldentriangle.mfa.domain.model.report.returns.MissingBestQuarterReport;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
import in.goldentriangle.mfa.domain.analytics.report.sip.SipCalculator;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipReport;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MultiplyOddsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RiskReport;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

public class FundReportEngine {

    private final GoldenTriangleEvaluator goldenTriangleEvaluator;
    private final TrailingReturnsCalculator trailingReturnsCalculator;
    private final RollingBandCalculator rollingBandCalculator;
    private final DrawdownCalculator drawdownCalculator;
    private final BestDaysCalculator bestDaysCalculator;
    private final AllTimeHighsCalculator allTimeHighsCalculator;
    private final CalendarYearInsightsCalculator calendarYearInsightsCalculator;
    private final ProbabilityCalculator probabilityCalculator;
    private final MultiplyOddsCalculator multiplyOddsCalculator;
    private final MissingBestQuarterCalculator missingBestQuarterCalculator;
    private final VolatilityCalculator volatilityCalculator;
    private final RiskReportBuilder riskReportBuilder;
    private final SipCalculator sipCalculator;
    private final StepUpSipCalculator stepUpSipCalculator;
    private final LumpsumCalculator lumpsumCalculator;
    private final TaxCalculator taxCalculator;
    private final ExpenseCalculator expenseCalculator;
    private final QualityScoreCalculator qualityScoreCalculator;
    private final VerdictEngine verdictEngine;
    private final MatrixCalculator matrixCalculator;
    private final Executor computeExecutor;
    private final ReportComputeMetrics metrics;

    public FundReportEngine(
            GoldenTriangleEvaluator goldenTriangleEvaluator,
            TrailingReturnsCalculator trailingReturnsCalculator,
            RollingBandCalculator rollingBandCalculator,
            DrawdownCalculator drawdownCalculator,
            BestDaysCalculator bestDaysCalculator,
            AllTimeHighsCalculator allTimeHighsCalculator,
            CalendarYearInsightsCalculator calendarYearInsightsCalculator,
            ProbabilityCalculator probabilityCalculator,
            MultiplyOddsCalculator multiplyOddsCalculator,
            MissingBestQuarterCalculator missingBestQuarterCalculator,
            VolatilityCalculator volatilityCalculator,
            RiskReportBuilder riskReportBuilder,
            SipCalculator sipCalculator,
            StepUpSipCalculator stepUpSipCalculator,
            LumpsumCalculator lumpsumCalculator,
            TaxCalculator taxCalculator,
            ExpenseCalculator expenseCalculator,
            QualityScoreCalculator qualityScoreCalculator,
            VerdictEngine verdictEngine,
            MatrixCalculator matrixCalculator,
            Executor computeExecutor,
            ReportComputeMetrics metrics) {
        this.goldenTriangleEvaluator = goldenTriangleEvaluator;
        this.trailingReturnsCalculator = trailingReturnsCalculator;
        this.rollingBandCalculator = rollingBandCalculator;
        this.drawdownCalculator = drawdownCalculator;
        this.bestDaysCalculator = bestDaysCalculator;
        this.allTimeHighsCalculator = allTimeHighsCalculator;
        this.calendarYearInsightsCalculator = calendarYearInsightsCalculator;
        this.probabilityCalculator = probabilityCalculator;
        this.multiplyOddsCalculator = multiplyOddsCalculator;
        this.missingBestQuarterCalculator = missingBestQuarterCalculator;
        this.volatilityCalculator = volatilityCalculator;
        this.riskReportBuilder = riskReportBuilder;
        this.sipCalculator = sipCalculator;
        this.stepUpSipCalculator = stepUpSipCalculator;
        this.lumpsumCalculator = lumpsumCalculator;
        this.taxCalculator = taxCalculator;
        this.expenseCalculator = expenseCalculator;
        this.qualityScoreCalculator = qualityScoreCalculator;
        this.verdictEngine = verdictEngine;
        this.matrixCalculator = matrixCalculator;
        this.computeExecutor = computeExecutor;
        this.metrics = metrics;
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

        CompletableFuture<GoldenTriangleResult> goldenTriangleFuture = supplyAsync(
                "goldenTriangle",
                () -> goldenTriangleEvaluator.evaluate(input));
        CompletableFuture<TrailingReturnsReport> trailingFuture = supplyAsync(
                "trailing",
                () -> trailingReturnsCalculator.compute(history));
        CompletableFuture<DrawdownReport> drawdownFuture = supplyAsync(
                "drawdown",
                () -> drawdownCalculator.compute(history.fundNav(), history.benchmarkNav()));
        CompletableFuture<BestDaysReport> bestDaysFuture = supplyAsync(
                "bestDays",
                () -> bestDaysCalculator.compute(history.fundNav()));
        CompletableFuture<AllTimeHighsReport> allTimeHighsFuture = supplyAsync(
                "allTimeHighs",
                () -> allTimeHighsCalculator.compute(history.fundNav(), history.fundName()));
        CompletableFuture<ConsistencyReport> consistencyFuture = supplyAsync(
                "consistency",
                () -> drawdownCalculator.calendarYears(history.fundNav()));
        CompletableFuture<SipReport> sipFuture = supplyAsync(
                "sip",
                () -> sipCalculator.compute(history));
        CompletableFuture<StepUpSipReport> stepUpSipFuture = supplyAsync(
                "stepUpSip",
                () -> stepUpSipCalculator.compute(history));
        CompletableFuture<LumpsumReport> lumpsumFuture = supplyAsync(
                "lumpsum",
                () -> lumpsumCalculator.compute(history));
        CompletableFuture<ProbabilityReport> probabilityFuture = supplyAsync(
                "probability",
                () -> probabilityCalculator.compute(rollingData));
        CompletableFuture<MultiplyOddsReport> multiplyOddsFuture = supplyAsync(
                "multiplyOdds",
                () -> multiplyOddsCalculator.compute(history.fundNav()));
        CompletableFuture<MissingBestQuarterReport> missingBestQuarterFuture = supplyAsync(
                "missingBestQuarter",
                () -> missingBestQuarterCalculator.compute(history.fundNav()));
        CompletableFuture<VolatilityReport> volatilityFuture = supplyAsync(
                "volatility",
                () -> volatilityCalculator.compute(history.fundNav(), history.benchmarkNav()));

        GoldenTriangleResult goldenTriangle = goldenTriangleFuture.join();
        FundMetrics fundMetrics = goldenTriangle.metrics();

        CompletableFuture<RollingReturnsReport> rollingFuture = supplyAsync(
                "rolling",
                () -> rollingBandCalculator.compute(rollingData, fundMetrics.consistencyScore()));
        CompletableFuture<BenchmarkComparisonReport> benchmarkFuture = supplyAsync(
                "benchmark",
                () -> buildBenchmark(fundMetrics, rollingBandCalculator.winningPercent(rollingData)));
        CompletableFuture<TaxReport> taxFuture = supplyAsync(
                "tax",
                () -> taxCalculator.compute(fundMetrics.totalReturn(), fundMetrics.fundAgeYears(), 100_000));
        CompletableFuture<ExpenseReport> expenseFuture = supplyAsync(
                "expense",
                () -> expenseCalculator.compute(
                        metadata.flatMap(m -> Optional.of(m.expenseRatio())),
                        100_000,
                        fundMetrics.fundAnnReturn()));
        CompletableFuture<QualityScoreReport> qualityFuture = supplyAsync(
                "quality",
                () -> qualityScoreCalculator.compute(fundMetrics));

        DrawdownReport drawdown = drawdownFuture.join();
        ConsistencyReport consistency = consistencyFuture.join();

        CompletableFuture<CalendarYearInsightsReport> calendarInsightsFuture = supplyAsync(
                "calendarYearInsights",
                () -> calendarYearInsightsCalculator.compute(history.fundNav(), consistency));
        CompletableFuture<RiskReport> riskFuture = supplyAsync(
                "risk",
                () -> riskReportBuilder.build(rollingData, periodLabel, fundMetrics, drawdown));

        FundProfile profile = buildProfile(history, metadata, goldenTriangle, fundMetrics);
        QualityScoreReport quality = qualityFuture.join();
        List<String> insights = goldenTriangleEvaluator.generateInsights(goldenTriangle);
        ProsConsReport prosCons = verdictEngine.prosCons(goldenTriangle, fundMetrics);
        InvestorFitReport investorFit = verdictEngine.investorFit(goldenTriangle, fundMetrics);
        RecommendationReport recommendation = verdictEngine.recommend(goldenTriangle, fundMetrics, quality.score());

        return new FundReport(
                history.scheme(),
                profile,
                goldenTriangle,
                trailingFuture.join(),
                rollingFuture.join(),
                calendarInsightsFuture.join(),
                benchmarkFuture.join(),
                probabilityFuture.join(),
                multiplyOddsFuture.join(),
                riskFuture.join(),
                consistency,
                drawdown,
                bestDaysFuture.join(),
                missingBestQuarterFuture.join(),
                volatilityFuture.join(),
                allTimeHighsFuture.join(),
                sipFuture.join(),
                stepUpSipFuture.join(),
                lumpsumFuture.join(),
                taxFuture.join(),
                expenseFuture.join(),
                quality,
                insights,
                prosCons,
                investorFit,
                recommendation,
                computedAt);
    }

    public MatrixReport buildMatrix(NavHistory history, MatrixMode mode) {
        return metrics.time("matrix", () -> matrixCalculator.compute(history, mode));
    }

    private <T> CompletableFuture<T> supplyAsync(String stage, java.util.function.Supplier<T> supplier) {
        return CompletableFuture.supplyAsync(
                () -> metrics.time(stage, supplier),
                computeExecutor);
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
