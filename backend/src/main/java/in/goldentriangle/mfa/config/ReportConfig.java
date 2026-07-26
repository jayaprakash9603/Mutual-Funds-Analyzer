package in.goldentriangle.mfa.config;

import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.DrawdownCalculator;
import in.goldentriangle.mfa.domain.analytics.report.ExpenseCalculator;
import in.goldentriangle.mfa.domain.analytics.report.FundReportEngine;
import in.goldentriangle.mfa.domain.analytics.report.LumpsumCalculator;
import in.goldentriangle.mfa.domain.analytics.report.MatrixCalculator;
import in.goldentriangle.mfa.domain.analytics.report.ProbabilityCalculator;
import in.goldentriangle.mfa.domain.analytics.report.QualityScoreCalculator;
import in.goldentriangle.mfa.domain.analytics.report.RiskReportBuilder;
import in.goldentriangle.mfa.domain.analytics.report.RollingBandCalculator;
import in.goldentriangle.mfa.domain.analytics.report.SipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.TaxCalculator;
import in.goldentriangle.mfa.domain.analytics.report.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.VerdictEngine;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
    FundReportEngine fundReportEngine(
            GoldenTriangleEvaluator goldenTriangleEvaluator,
            TrailingReturnsCalculator trailingReturnsCalculator,
            RollingBandCalculator rollingBandCalculator,
            DrawdownCalculator drawdownCalculator,
            ProbabilityCalculator probabilityCalculator,
            RiskReportBuilder riskReportBuilder,
            SipCalculator sipCalculator,
            LumpsumCalculator lumpsumCalculator,
            TaxCalculator taxCalculator,
            ExpenseCalculator expenseCalculator,
            QualityScoreCalculator qualityScoreCalculator,
            VerdictEngine verdictEngine,
            MatrixCalculator matrixCalculator) {
        return new FundReportEngine(
                goldenTriangleEvaluator,
                trailingReturnsCalculator,
                rollingBandCalculator,
                drawdownCalculator,
                probabilityCalculator,
                riskReportBuilder,
                sipCalculator,
                lumpsumCalculator,
                taxCalculator,
                expenseCalculator,
                qualityScoreCalculator,
                verdictEngine,
                matrixCalculator);
    }
}
