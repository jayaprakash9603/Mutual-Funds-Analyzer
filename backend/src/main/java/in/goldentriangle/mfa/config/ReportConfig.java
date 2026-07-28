package in.goldentriangle.mfa.config;

import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.properties.ReportProperties;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.drawdown.DrawdownCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.ExpenseCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.FundReportEngine;
import in.goldentriangle.mfa.domain.analytics.report.sip.LumpsumCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.MatrixCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.ProbabilityCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.QualityScoreCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.RiskReportBuilder;
import in.goldentriangle.mfa.domain.analytics.report.matrix.RollingBandCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.SipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarYearInsightsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.AllTimeHighsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.BestDaysCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.VerdictEngine;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import in.goldentriangle.mfa.config.metrics.ReportComputeMetrics;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executor;

@Configuration
@EnableConfigurationProperties(ReportProperties.class)
public class ReportConfig {

    @Bean
    TrailingReturnsCalculator trailingReturnsCalculator() {
        return new TrailingReturnsCalculator();
    }

    @Bean
    RollingBandCalculator rollingBandCalculator() {
        return new RollingBandCalculator();
    }

    @Bean
    DrawdownCalculator drawdownCalculator() {
        return new DrawdownCalculator();
    }

    @Bean
    MatrixCalculator matrixCalculator() {
        return new MatrixCalculator();
    }

    @Bean
    ProbabilityCalculator probabilityCalculator() {
        return new ProbabilityCalculator();
    }

    @Bean
    RiskReportBuilder riskReportBuilder(MetricsCalculator metricsCalculator, DrawdownCalculator drawdownCalculator, AnalyticsProperties properties) {
        return new RiskReportBuilder(metricsCalculator, drawdownCalculator, properties.tradingDays());
    }

    @Bean
    SipCalculator sipCalculator(TaxCalculator taxCalculator) {
        return new SipCalculator(taxCalculator);
    }

    @Bean
    LumpsumCalculator lumpsumCalculator() {
        return new LumpsumCalculator();
    }

    @Bean
    TaxCalculator taxCalculator() {
        return new TaxCalculator();
    }

    @Bean
    ExpenseCalculator expenseCalculator() {
        return new ExpenseCalculator();
    }

    @Bean
    QualityScoreCalculator qualityScoreCalculator() {
        return new QualityScoreCalculator();
    }

    @Bean
    VerdictEngine verdictEngine() {
        return new VerdictEngine();
    }

    @Bean
    BestDaysCalculator bestDaysCalculator() {
        return new BestDaysCalculator();
    }

    @Bean
    AllTimeHighsCalculator allTimeHighsCalculator() {
        return new AllTimeHighsCalculator();
    }

    @Bean
    CalendarYearInsightsCalculator calendarYearInsightsCalculator() {
        return new CalendarYearInsightsCalculator();
    }

    @Bean
    FundReportEngine fundReportEngine(
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
            MatrixCalculator matrixCalculator,
            @Qualifier("computeExecutor") Executor computeExecutor,
            ReportComputeMetrics metrics) {
        return new FundReportEngine(
                goldenTriangleEvaluator,
                trailingReturnsCalculator,
                rollingBandCalculator,
                drawdownCalculator,
                bestDaysCalculator,
                allTimeHighsCalculator,
                calendarYearInsightsCalculator,
                probabilityCalculator,
                riskReportBuilder,
                sipCalculator,
                lumpsumCalculator,
                taxCalculator,
                expenseCalculator,
                qualityScoreCalculator,
                verdictEngine,
                matrixCalculator,
                computeExecutor,
                metrics);
    }
}
