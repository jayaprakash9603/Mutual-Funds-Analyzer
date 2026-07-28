package in.goldentriangle.mfa.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.FundReportSectionSnapshotMapper;
import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.application.report.FundReportSectionExtractor;
import in.goldentriangle.mfa.application.report.FundReportSectionService;
import in.goldentriangle.mfa.application.report.ReportDataCoordinator;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.domain.model.NavFreshness;
import in.goldentriangle.mfa.domain.model.ReportFreshness;
import in.goldentriangle.mfa.domain.model.ReportSectionEnvelope;
import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.model.report.assessment.InvestorFitReport;
import in.goldentriangle.mfa.domain.model.report.assessment.ProbabilityReport;
import in.goldentriangle.mfa.domain.model.report.assessment.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.QualityScoreReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RecommendationReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RiskReport;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownReport;
import in.goldentriangle.mfa.domain.model.report.investment.ExpenseReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;
import in.goldentriangle.mfa.domain.model.report.returns.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.BestDaysReport;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarYearInsightsReport;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.FundProfile;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.port.out.FundReportSectionSnapshotPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FundReportSectionServiceTest {

    private static final Instant WATERMARK = Instant.parse("2026-01-01T00:00:00Z");
    private static final Instant COMPUTED = Instant.parse("2026-01-02T00:00:00Z");

    private FundReportSectionService service;
    private InMemorySectionSnapshotStore snapshotStore;
    private ReportDataCoordinator reportDataCoordinator;
    private NavHistoryPort navHistoryPort;

    @BeforeEach
    void setUp() {
        snapshotStore = new InMemorySectionSnapshotStore();
        reportDataCoordinator = mock(ReportDataCoordinator.class);
        navHistoryPort = mock(NavHistoryPort.class);
        FeatureGuard featureGuard = mock(FeatureGuard.class);

        when(reportDataCoordinator.resolveStartDate(any())).thenReturn("inception");
        FundReport report = sampleReport();
        when(reportDataCoordinator.prepare(eq("Test Fund"), eq("inception")))
                .thenReturn(new ReportDataCoordinator.PreparedReport(
                        report, WATERMARK, COMPUTED, false));
        when(reportDataCoordinator.prepareRefreshed(eq("Test Fund"), eq("inception")))
                .thenReturn(new ReportDataCoordinator.PreparedReport(
                        report, Instant.parse("2026-07-27T00:00:00Z"), COMPUTED, false));
        when(navHistoryPort.navFreshness("Test Fund"))
                .thenReturn(new NavFreshness(Optional.of(WATERMARK), false));
        doNothing().when(featureGuard).require(any());
        doNothing().when(reportDataCoordinator).evictReportCaches(any(), any());

        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        service = new FundReportSectionService(
                reportDataCoordinator,
                snapshotStore,
                navHistoryPort,
                featureGuard,
                objectMapper,
                Runnable::run,
                new SingleFlightCoordinator());
    }

    @Test
    void concurrentColdLoadsReturnMatchingSectionPayloads() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(5);
        try {
            Future<ReportSectionEnvelope<FundReportOverviewSection>> overview =
                    pool.submit(() -> service.getOverview("Test Fund", null));
            Future<ReportSectionEnvelope<FundReportPerformanceSection>> performance =
                    pool.submit(() -> service.getPerformance("Test Fund", null));
            Future<ReportSectionEnvelope<FundReportRiskSection>> risk =
                    pool.submit(() -> service.getRisk("Test Fund", null));
            Future<ReportSectionEnvelope<FundReportInvestmentSection>> investment =
                    pool.submit(() -> service.getInvestment("Test Fund", null));
            Future<ReportSectionEnvelope<FundReportAssessmentSection>> assessment =
                    pool.submit(() -> service.getAssessment("Test Fund", null));

            assertInstanceOf(FundReportOverviewSection.class, overview.get().data());
            assertInstanceOf(FundReportPerformanceSection.class, performance.get().data());
            assertInstanceOf(FundReportRiskSection.class, risk.get().data());
            assertInstanceOf(FundReportInvestmentSection.class, investment.get().data());
            assertInstanceOf(FundReportAssessmentSection.class, assessment.get().data());
        } finally {
            pool.shutdownNow();
        }

        assertEquals(5, snapshotStore.size());
    }

    @Test
    void servesStaleSnapshotWhenUpstreamCheckIsDue() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        FundReportOverviewSection overview = (FundReportOverviewSection) FundReportSectionExtractor.extract(
                ReportSectionGroup.OVERVIEW,
                sampleReport());
        snapshotStore.save(new FundReportSectionSnapshot(
                "Test Fund",
                "inception",
                ReportSectionGroup.OVERVIEW,
                FundReportSectionSnapshotMapper.writePayload(overview, objectMapper),
                WATERMARK,
                COMPUTED,
                ReportDataCoordinator.REPORT_SCHEMA_VERSION,
                0L));
        when(navHistoryPort.navFreshness("Test Fund"))
                .thenReturn(new NavFreshness(Optional.of(WATERMARK), true));

        ReportSectionEnvelope<FundReportOverviewSection> envelope =
                service.getOverview("Test Fund", null);

        assertEquals(ReportFreshness.STALE, envelope.freshness());
        verify(reportDataCoordinator).prepareRefreshed("Test Fund", "inception");
    }

    @Test
    void servesFreshSnapshotWhenWatermarkMatchesAndNavIsLive() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        FundReportOverviewSection overview = (FundReportOverviewSection) FundReportSectionExtractor.extract(
                ReportSectionGroup.OVERVIEW,
                sampleReport());
        snapshotStore.save(new FundReportSectionSnapshot(
                "Test Fund",
                "inception",
                ReportSectionGroup.OVERVIEW,
                FundReportSectionSnapshotMapper.writePayload(overview, objectMapper),
                WATERMARK,
                COMPUTED,
                ReportDataCoordinator.REPORT_SCHEMA_VERSION,
                0L));

        ReportSectionEnvelope<FundReportOverviewSection> envelope =
                service.getOverview("Test Fund", null);

        assertEquals(ReportFreshness.FRESH, envelope.freshness());
    }

    private static FundReport sampleReport() {
        FundProfile profile = new FundProfile(
                "Test Fund",
                "AMC",
                "Equity",
                "Benchmark",
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                10.0,
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                100.0,
                Optional.empty(),
                Optional.empty(),
                "Good",
                4,
                WATERMARK,
                WATERMARK);
        return new FundReport(
                "Test Fund",
                profile,
                mock(in.goldentriangle.mfa.domain.model.GoldenTriangleResult.class),
                mock(TrailingReturnsReport.class),
                mock(RollingReturnsReport.class),
                mock(CalendarYearInsightsReport.class),
                mock(BenchmarkComparisonReport.class),
                mock(ProbabilityReport.class),
                mock(RiskReport.class),
                mock(ConsistencyReport.class),
                mock(DrawdownReport.class),
                mock(BestDaysReport.class),
                mock(AllTimeHighsReport.class),
                mock(SipReport.class),
                mock(LumpsumReport.class),
                mock(TaxReport.class),
                mock(ExpenseReport.class),
                mock(QualityScoreReport.class),
                List.of("insight"),
                mock(ProsConsReport.class),
                mock(InvestorFitReport.class),
                mock(RecommendationReport.class),
                COMPUTED);
    }

    private static final class InMemorySectionSnapshotStore implements FundReportSectionSnapshotPort {
        private final Map<String, FundReportSectionSnapshot> store = new ConcurrentHashMap<>();

        @Override
        public Optional<FundReportSectionSnapshot> find(
                String scheme, String startDate, ReportSectionGroup sectionGroup) {
            return Optional.ofNullable(store.get(key(scheme, startDate, sectionGroup)));
        }

        @Override
        public FundReportSectionSnapshot save(FundReportSectionSnapshot snapshot) {
            store.put(key(snapshot.scheme(), snapshot.startDate(), snapshot.sectionGroup()), snapshot);
            return snapshot;
        }

        int size() {
            return store.size();
        }

        private static String key(String scheme, String startDate, ReportSectionGroup group) {
            return scheme + "|" + startDate + "|" + group.name();
        }
    }
}
