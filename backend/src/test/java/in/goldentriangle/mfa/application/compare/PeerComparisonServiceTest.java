package in.goldentriangle.mfa.application.compare;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.PeerComparisonSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.PeerFundSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

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
        peerDiscoveryService = new PeerDiscoveryService(schemeCatalogPort, cachePort);
        in.goldentriangle.mfa.domain.port.out.RollingReturnsPort rollingReturnsPort =
                mock(in.goldentriangle.mfa.domain.port.out.RollingReturnsPort.class);
        PeerFundSnapshotPort peerFundSnapshotPort = mock(PeerFundSnapshotPort.class);
        PeerComparisonSnapshotPort peerComparisonSnapshotPort = mock(PeerComparisonSnapshotPort.class);
        FeatureGuard featureGuard = mock(FeatureGuard.class);

        when(schemeCatalogPort.search(any(), any())).thenReturn(List.of("Peer A", "Peer B"));
        when(rollingReturnsPort.fetch(any())).thenReturn(sampleData());
        when(peerFundSnapshotPort.find(any(), any())).thenReturn(Optional.empty());
        when(peerComparisonSnapshotPort.find(any(), any(), any())).thenReturn(Optional.empty());

        service = new PeerComparisonService(
                rollingReturnsPort,
                peerDiscoveryService,
                peerFundSnapshotPort,
                peerComparisonSnapshotPort,
                featureGuard,
                new AnalyticsProperties(),
                new UpstreamProperties(
                        "analysis.investt.in", "/mutual-funds-research", Duration.ofSeconds(60), "01-01-2013"),
                Clock.fixed(java.time.Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC),
                new ObjectMapper(),
                Executors.newFixedThreadPool(4),
                new SingleFlightCoordinator());
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

    private RollingReturnsData sampleData() {
        List<RollingReturnRow> fund = List.of(
                new RollingReturnRow(1, "AMC", "Flexi Cap", "Fund", "5 Year",
                        "Jan 1, 2020", 100, "Jan 1, 2025", 200, 15),
                new RollingReturnRow(2, "AMC", "Flexi Cap", "Fund", "5 Year",
                        "Jan 1, 2021", 110, "Jan 1, 2026", 220, 16));
        return new RollingReturnsData(fund, fund);
    }
}
