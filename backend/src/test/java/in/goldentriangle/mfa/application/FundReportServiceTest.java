package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.application.report.FundReportService;
import in.goldentriangle.mfa.application.report.FundRollingReturnsAssembler;
import in.goldentriangle.mfa.application.report.ReportDataCoordinator;
import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.properties.ReportProperties;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.config.metrics.ReportComputeMetrics;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.TimelineBuilder;
import in.goldentriangle.mfa.domain.analytics.insight.InsightComposer;
import in.goldentriangle.mfa.domain.analytics.report.drawdown.DrawdownCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.ExpenseCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.FundReportEngine;
import in.goldentriangle.mfa.domain.analytics.report.sip.LumpsumCalculator;
import in.goldentriangle.mfa.domain.analytics.report.matrix.MatrixCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.NavHistoryAssembler;
import in.goldentriangle.mfa.domain.analytics.report.matrix.ProbabilityCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.QualityScoreCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.RiskReportBuilder;
import in.goldentriangle.mfa.domain.analytics.report.matrix.RollingBandCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.SipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.StepUpSipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.StpCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.SwpCalculator;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarYearInsightsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.AllTimeHighsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.BestDaysCalculator;
import in.goldentriangle.mfa.domain.analytics.report.returns.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.core.VerdictEngine;
import in.goldentriangle.mfa.domain.analytics.rule.CobRule;
import in.goldentriangle.mfa.domain.analytics.rule.RollingReturnRule;
import in.goldentriangle.mfa.domain.analytics.rule.RuleEngine;
import in.goldentriangle.mfa.domain.analytics.rule.SharpeRule;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundMetadataPort;
import in.goldentriangle.mfa.domain.port.out.FundReportSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FundReportServiceTest {

    private FundReportService service;

    @BeforeEach
    void setUp() {
        FundRollingReturnsAssembler rollingReturnsAssembler = mock(FundRollingReturnsAssembler.class);
        NavHistoryPort navHistoryPort = mock(NavHistoryPort.class);
        FundMetadataPort metadataPort = mock(FundMetadataPort.class);
        FeatureGuard featureGuard = mock(FeatureGuard.class);
        CachePort cachePort = new CachePort() {
            @Override
            public <T> Optional<T> get(String key, Class<T> type) {
                return Optional.empty();
            }

            @Override
            public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
                return loader.get();
            }

            @Override
            public void evict(String key) {
            }
        };

        Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
        MetricsCalculator metricsCalculator = new MetricsCalculator(0.06, 252, clock);
        RuleEngine ruleEngine = new RuleEngine(List.of(new RollingReturnRule(), new CobRule(), new SharpeRule()));
        InsightComposer insightComposer = new InsightComposer(List.of());
        GoldenTriangleEvaluator evaluator = new GoldenTriangleEvaluator(
                metricsCalculator, ruleEngine, insightComposer, new TimelineBuilder());

        FundReportEngine engine = new FundReportEngine(
                evaluator,
                new TrailingReturnsCalculator(),
                new RollingBandCalculator(),
                new DrawdownCalculator(),
                new BestDaysCalculator(),
                new AllTimeHighsCalculator(),
                new CalendarYearInsightsCalculator(),
                new ProbabilityCalculator(),
                new RiskReportBuilder(metricsCalculator, new DrawdownCalculator(), 252),
                new SipCalculator(new TaxCalculator()),
                new StepUpSipCalculator(new TaxCalculator()),
                new LumpsumCalculator(),
                new TaxCalculator(),
                new ExpenseCalculator(),
                new QualityScoreCalculator(),
                new VerdictEngine(),
                new MatrixCalculator(),
                Runnable::run,
                new ReportComputeMetrics(new SimpleMeterRegistry()));

        ReportProperties reportProperties = new ReportProperties();
        FeatureFlags featureFlags = new FeatureFlags();
        MatrixSnapshotPort matrixSnapshotPort = mock(MatrixSnapshotPort.class);
        FundReportSnapshotPort reportSnapshotPort = mock(FundReportSnapshotPort.class);

        when(metadataPort.fetch(any())).thenReturn(Optional.empty());

        RollingReturnsData data = sampleData();
        when(rollingReturnsAssembler.assembleFromHistory(any(), any(), any())).thenReturn(data);
        when(navHistoryPort.fetch(any(), any())).thenReturn(
                NavHistoryAssembler.assemble("Test Fund", data, "01-01-2020"));

        ReportDataCoordinator reportDataCoordinator = new ReportDataCoordinator(
                navHistoryPort,
                rollingReturnsAssembler,
                metadataPort,
                engine,
                reportSnapshotPort,
                featureFlags,
                reportProperties,
                cachePort,
                clock,
                Runnable::run,
                new SingleFlightCoordinator(),
                new ReportComputeMetrics(new SimpleMeterRegistry()));

        service = new FundReportService(
                navHistoryPort,
                engine,
                new SipCalculator(new TaxCalculator()),
                new LumpsumCalculator(),
                new StepUpSipCalculator(new TaxCalculator()),
                new SwpCalculator(new TaxCalculator()),
                new StpCalculator(),
                matrixSnapshotPort,
                reportDataCoordinator,
                featureGuard,
                featureFlags,
                cachePort,
                clock,
                Runnable::run,
                new SingleFlightCoordinator());
    }

    @Test
    void buildsFundReport() {
        var report = service.get("Test Fund", "01-01-2020");
        assertNotNull(report);
        assertEquals("Test Fund", report.scheme());
        assertNotNull(report.recommendation());
    }

    @Test
    void buildsMatrix() {
        var bundle = service.getMatrix("Test Fund", "01-01-2020", MatrixMode.LUMPSUM);
        assertNotNull(bundle);
        assertEquals(MatrixMode.LUMPSUM, bundle.matrix().mode());
        assertNotNull(bundle.recovery());
    }

    private RollingReturnsData sampleData() {
        List<RollingReturnRow> fund = List.of(
                new RollingReturnRow(1, "AMC", "Flexi Cap", "Test Fund", "5 Year",
                        "2020-01-01", 100, "2025-01-01", 200, 15),
                new RollingReturnRow(2, "AMC", "Flexi Cap", "Test Fund", "5 Year",
                        "2021-01-01", 110, "2026-01-01", 220, 16));
        List<RollingReturnRow> bench = List.of(
                new RollingReturnRow(3, "Idx", "Index", "Nifty 50 TRI", "5 Year",
                        "2020-01-01", 100, "2025-01-01", 180, 12),
                new RollingReturnRow(4, "Idx", "Index", "Nifty 50 TRI", "5 Year",
                        "2021-01-01", 105, "2026-01-01", 190, 13));
        return new RollingReturnsData(fund, bench);
    }
}
