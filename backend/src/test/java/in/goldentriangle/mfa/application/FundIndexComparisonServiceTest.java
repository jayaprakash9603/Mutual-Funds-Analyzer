package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.application.report.FundIndexComparisonService;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundIndexComparison;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.WelfordAccumulator;
import in.goldentriangle.mfa.domain.port.out.RollingAggregatePort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FundIndexComparisonServiceTest {

    @Mock
    private RollingReturnsPort rollingReturnsPort;

    @Mock
    private RollingAggregatePort aggregatePort;

    @Mock
    private FeatureGuard featureGuard;

    private FeatureFlags featureFlags;
    private AnalyticsProperties analyticsProperties;
    private UpstreamProperties upstreamProperties;
    private Clock clock;
    private FundIndexComparisonService service;

    @BeforeEach
    void setUp() {
        featureFlags = new FeatureFlags();
        featureFlags.getAnalysis().setFundIndexMatrix(true);
        featureFlags.getAnalysis().setIncrementalAggregates(true);

        analyticsProperties = new AnalyticsProperties();
        analyticsProperties.setMatrixPeriods(List.of("5 Year"));
        analyticsProperties.setRefreshAfter(Duration.ofDays(7));

        upstreamProperties = new UpstreamProperties(
                "analysis.investt.in",
                "/mutual-funds-research",
                Duration.ofSeconds(60),
                "01-01-2013");

        clock = Clock.fixed(Instant.parse("2026-01-15T00:00:00Z"), ZoneOffset.UTC);

        service = new FundIndexComparisonService(
                rollingReturnsPort,
                aggregatePort,
                featureFlags,
                featureGuard,
                analyticsProperties,
                upstreamProperties,
                clock,
                Executors.newSingleThreadExecutor());
    }

    @Test
    void freshAggregateSkipsUpstreamFetch() {
        RollingAggregate stored = storedAggregate(Instant.parse("2026-01-10T00:00:00Z"));
        when(aggregatePort.find("Test Fund", Period.FIVE_YEAR)).thenReturn(Optional.of(stored));

        FundIndexComparison comparison = service.get("Test Fund", "01-01-2013");

        verify(rollingReturnsPort, never()).fetch(any());
        assertEquals(1, comparison.rows().size());
        assertEquals("Test Fund", comparison.fundName());
    }

    @Test
    void staleAggregateUsesDeltaStartDate() {
        Instant watermark = Instant.parse("2024-06-01T00:00:00Z");
        RollingAggregate stored = storedAggregate(Instant.parse("2025-12-01T00:00:00Z"))
                .withComputedAt(Instant.parse("2025-12-01T00:00:00Z"));
        stored = new RollingAggregate(
                stored.scheme(),
                stored.period(),
                stored.fundName(),
                stored.benchmarkName(),
                stored.category(),
                stored.fundStats(),
                stored.indexStats(),
                stored.alignedCount(),
                stored.fundWinCount(),
                watermark,
                stored.computedAt(),
                stored.version());

        when(aggregatePort.find("Test Fund", Period.FIVE_YEAR)).thenReturn(Optional.of(stored));
        when(rollingReturnsPort.fetch(any())).thenReturn(sampleData("January 2, 2024"));
        when(aggregatePort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.get("Test Fund", "01-01-2013");

        ArgumentCaptor<AnalysisQuery> captor = ArgumentCaptor.forClass(AnalysisQuery.class);
        verify(rollingReturnsPort).fetch(captor.capture());
        assertEquals("02-06-2024", captor.getValue().startDate());
    }

    @Test
    void missingPeriodIsReportedWithoutFailingOthers() {
        when(aggregatePort.find("Test Fund", Period.FIVE_YEAR)).thenReturn(Optional.empty());
        when(rollingReturnsPort.fetch(any())).thenThrow(new NoDataFoundException("missing"));

        FundIndexComparison comparison = service.get("Test Fund", "01-01-2013");

        assertTrue(comparison.rows().isEmpty());
        assertEquals(List.of("5 Year"), comparison.missingPeriods());
        assertTrue(comparison.partial());
    }

    @Test
    void coldStartFetchesAndPersistsAggregate() {
        when(aggregatePort.find("Test Fund", Period.FIVE_YEAR)).thenReturn(Optional.empty());
        when(rollingReturnsPort.fetch(any())).thenReturn(sampleData("January 1, 2018"));
        when(aggregatePort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        FundIndexComparison comparison = service.get("Test Fund", "01-01-2013");

        verify(rollingReturnsPort, times(1)).fetch(any());
        verify(aggregatePort).save(any());
        assertEquals(1, comparison.rows().size());
        assertEquals(100.0, comparison.rows().get(0).cob(), 1e-9);
    }

    private RollingAggregate storedAggregate(Instant computedAt) {
        WelfordAccumulator fund = WelfordAccumulator.empty();
        fund.add(12.0);
        fund.add(14.0);
        WelfordAccumulator index = WelfordAccumulator.empty();
        index.add(10.0);
        index.add(11.0);
        return new RollingAggregate(
                "Test Fund",
                Period.FIVE_YEAR,
                "Test Fund",
                "NIFTY TRI",
                "Flexi Cap",
                fund,
                index,
                2,
                1,
                Instant.parse("2024-01-01T00:00:00Z"),
                computedAt,
                1);
    }

    private RollingReturnsData sampleData(String navDate) {
        RollingReturnRow fund = new RollingReturnRow(
                1, "AMC", "Flexi Cap", "Test Fund", "5 Year",
                navDate, 100, navDate, 110, 12.0);
        RollingReturnRow benchmark = new RollingReturnRow(
                2, "Index", "Flexi Cap", "NIFTY TRI", "5 Year",
                navDate, 100, navDate, 108, 10.0);
        return new RollingReturnsData(List.of(fund), List.of(benchmark));
    }
}
