package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.ReportProperties;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.TimelineBuilder;
import in.goldentriangle.mfa.domain.analytics.insight.InsightComposer;
import in.goldentriangle.mfa.domain.analytics.report.DrawdownCalculator;
import in.goldentriangle.mfa.domain.analytics.report.ExpenseCalculator;
import in.goldentriangle.mfa.domain.analytics.report.FundReportEngine;
import in.goldentriangle.mfa.domain.analytics.report.LumpsumCalculator;
import in.goldentriangle.mfa.domain.analytics.report.MatrixCalculator;
import in.goldentriangle.mfa.domain.analytics.report.NavHistoryAssembler;
import in.goldentriangle.mfa.domain.analytics.report.ProbabilityCalculator;
import in.goldentriangle.mfa.domain.analytics.report.QualityScoreCalculator;
import in.goldentriangle.mfa.domain.analytics.report.RiskReportBuilder;
import in.goldentriangle.mfa.domain.analytics.report.RollingBandCalculator;
import in.goldentriangle.mfa.domain.analytics.report.SipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.TaxCalculator;
import in.goldentriangle.mfa.domain.analytics.report.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.analytics.report.VerdictEngine;
import in.goldentriangle.mfa.domain.analytics.rule.CobRule;
import in.goldentriangle.mfa.domain.analytics.rule.RollingReturnRule;
import in.goldentriangle.mfa.domain.analytics.rule.RuleEngine;
import in.goldentriangle.mfa.domain.analytics.rule.SharpeRule;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundMetadataPort;
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
    private FundRollingReturnsAssembler rollingReturnsAssembler;

    @BeforeEach
    void setUp() {
        rollingReturnsAssembler = mock(FundRollingReturnsAssembler.class);
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
                new ProbabilityCalculator(),
                new RiskReportBuilder(metricsCalculator, new DrawdownCalculator(), 252),
                new SipCalculator(),
                new LumpsumCalculator(),
                new TaxCalculator(),
                new ExpenseCalculator(),
                new QualityScoreCalculator(),
                new VerdictEngine(),
                new MatrixCalculator());

        ReportProperties reportProperties = new ReportProperties();

        when(metadataPort.fetch(any())).thenReturn(Optional.empty());

        RollingReturnsData data = sampleData();
        when(rollingReturnsAssembler.assembleFromHistory(any(), any(), any())).thenReturn(data);
        when(navHistoryPort.fetch(any(), any())).thenReturn(
                NavHistoryAssembler.assemble("Test Fund", data, "01-01-2020"));

        service = new FundReportService(
                navHistoryPort,
                rollingReturnsAssembler,
                metadataPort,
                engine,
                featureGuard,
                reportProperties,
                cachePort,
                clock);
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
        var matrix = service.getMatrix("Test Fund", "01-01-2020", MatrixMode.LUMPSUM);
        assertNotNull(matrix);
        assertEquals(MatrixMode.LUMPSUM, matrix.mode());
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
