package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.AnalyticsProperties;
import in.goldentriangle.mfa.config.FeatureFlags;
import in.goldentriangle.mfa.config.UpstreamProperties;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;
import in.goldentriangle.mfa.domain.port.in.GetPeerComparisonUseCase;
import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PeerComparisonServiceTest {

    private PeerComparisonService service;
    private SchemeCatalogPort schemeCatalogPort;

    @BeforeEach
    void setUp() {
        schemeCatalogPort = mock(SchemeCatalogPort.class);
        in.goldentriangle.mfa.domain.port.out.RollingReturnsPort rollingReturnsPort =
                mock(in.goldentriangle.mfa.domain.port.out.RollingReturnsPort.class);
        FeatureGuard featureGuard = mock(FeatureGuard.class);

        when(schemeCatalogPort.search(any(), any())).thenReturn(List.of("Peer A", "Peer B"));
        when(rollingReturnsPort.fetch(any())).thenReturn(sampleData());

        service = new PeerComparisonService(
                schemeCatalogPort,
                rollingReturnsPort,
                featureGuard,
                new AnalyticsProperties(),
                new UpstreamProperties(
                        "analysis.investt.in", "/mutual-funds-research", Duration.ofSeconds(60), "01-01-2013"),
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
    }

    @Test
    void returnsPeerRows() {
        PeerComparisonReport report = service.compare("Test Fund", "Flexi Cap");
        assertFalse(report.peers().isEmpty());
    }

    private RollingReturnsData sampleData() {
        List<RollingReturnRow> fund = List.of(
                new RollingReturnRow(1, "AMC", "Flexi Cap", "Fund", "5 Year",
                        "2020-01-01", 100, "2025-01-01", 200, 15));
        return new RollingReturnsData(fund, fund);
    }
}
