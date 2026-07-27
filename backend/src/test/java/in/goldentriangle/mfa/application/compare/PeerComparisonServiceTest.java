package in.goldentriangle.mfa.application.compare;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.analytics.report.returns.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;
import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PeerComparisonServiceTest {

    private PeerComparisonService service;
    private SchemeCatalogPort schemeCatalogPort;
    private PeerDiscoveryService peerDiscoveryService;

    @BeforeEach
    void setUp() {
        schemeCatalogPort = mock(SchemeCatalogPort.class);
        peerDiscoveryService = new PeerDiscoveryService(schemeCatalogPort);
        in.goldentriangle.mfa.domain.port.out.RollingReturnsPort rollingReturnsPort =
                mock(in.goldentriangle.mfa.domain.port.out.RollingReturnsPort.class);
        NavHistoryPort navHistoryPort = mock(NavHistoryPort.class);
        FeatureGuard featureGuard = mock(FeatureGuard.class);

        when(schemeCatalogPort.search(any(), any())).thenReturn(List.of("Peer A", "Peer B"));
        when(rollingReturnsPort.fetch(any())).thenReturn(sampleData());
        when(navHistoryPort.fetch(any(), any())).thenReturn(sampleNavHistory());

        service = new PeerComparisonService(
                rollingReturnsPort,
                navHistoryPort,
                peerDiscoveryService,
                featureGuard,
                new AnalyticsProperties(),
                new UpstreamProperties(
                        "analysis.investt.in", "/mutual-funds-research", Duration.ofSeconds(60), "01-01-2013"),
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC),
                new TrailingReturnsCalculator(),
                Executors.newSingleThreadExecutor());
    }

    @Test
    void returnsPeerRowsWithKeyParameters() {
        PeerComparisonReport report = service.compare("Test Fund", "Flexi Cap");
        assertFalse(report.peers().isEmpty());
        assertTrue(report.peers().stream().anyMatch(PeerComparisonReport.PeerRow::selected));
        assertTrue(report.peers().get(0).totalRecords() > 0);
        assertFalse(report.peers().get(0).horizonReturns().isEmpty());
        assertNotNull(report.longRunAnalysis());
    }

    @Test
    void searchesPeersUsingCategoryKeywordsAcrossAllCategories() {
        service.compare("Test Fund", "Equity Scheme - Small Cap Fund");
        verify(schemeCatalogPort).search("Small Cap", "All");
    }

    @Test
    void reducesSebiCategoryNamesToSearchableKeywords() {
        assertEquals("Small Cap", PeerDiscoveryService.categoryKeywords("Equity Scheme - Small Cap Fund"));
        assertEquals("Flexi Cap", PeerDiscoveryService.categoryKeywords("Equity Scheme - Flexi Cap Fund"));
        assertEquals("", PeerDiscoveryService.categoryKeywords("All"));
    }

    private NavHistory sampleNavHistory() {
        Instant start = Instant.parse("2000-01-01T00:00:00Z");
        Instant end = Instant.parse("2026-01-01T00:00:00Z");
        return new NavHistory(
                "Test Fund",
                "Test Fund",
                "Benchmark",
                "Flexi Cap",
                "AMC",
                List.of(
                        new NavPoint(start, 100),
                        new NavPoint(end, 800)),
                List.of(),
                start,
                end,
                "01-01-2013");
    }

    private RollingReturnsData sampleData() {
        List<RollingReturnRow> fund = List.of(
                new RollingReturnRow(1, "AMC", "Flexi Cap", "Fund", "5 Year",
                        "2020-01-01", 100, "2025-01-01", 200, 15),
                new RollingReturnRow(2, "AMC", "Flexi Cap", "Fund", "5 Year",
                        "2021-01-01", 110, "2026-01-01", 220, 16));
        return new RollingReturnsData(fund, fund);
    }
}
