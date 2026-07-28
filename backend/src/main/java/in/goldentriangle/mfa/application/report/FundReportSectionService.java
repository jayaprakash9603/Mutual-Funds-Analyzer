package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.FundReportSectionSnapshotMapper;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.NavFreshness;
import in.goldentriangle.mfa.domain.model.ReportFreshness;
import in.goldentriangle.mfa.domain.model.ReportSectionEnvelope;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;
import in.goldentriangle.mfa.domain.port.in.GetFundReportSectionUseCase;
import in.goldentriangle.mfa.domain.port.out.FundReportSectionSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;

@Service
public class FundReportSectionService implements GetFundReportSectionUseCase {

    private static final String BENCHMARK_UNAVAILABLE = "Benchmark unavailable";

    private final ReportDataCoordinator reportDataCoordinator;
    private final FundReportSectionSnapshotPort sectionSnapshotPort;
    private final NavHistoryPort navHistoryPort;
    private final FeatureGuard featureGuard;
    private final ObjectMapper objectMapper;
    private final Executor computeExecutor;
    private final SingleFlightCoordinator singleFlightCoordinator;
    private final Set<String> refreshingKeys = ConcurrentHashMap.newKeySet();

    public FundReportSectionService(
            ReportDataCoordinator reportDataCoordinator,
            FundReportSectionSnapshotPort sectionSnapshotPort,
            NavHistoryPort navHistoryPort,
            FeatureGuard featureGuard,
            ObjectMapper objectMapper,
            @Qualifier("computeExecutor") Executor computeExecutor,
            SingleFlightCoordinator singleFlightCoordinator) {
        this.reportDataCoordinator = reportDataCoordinator;
        this.sectionSnapshotPort = sectionSnapshotPort;
        this.navHistoryPort = navHistoryPort;
        this.featureGuard = featureGuard;
        this.objectMapper = objectMapper;
        this.computeExecutor = computeExecutor;
        this.singleFlightCoordinator = singleFlightCoordinator;
    }

    @Override
    public ReportSectionEnvelope<FundReportOverviewSection> getOverview(String scheme, String startDate) {
        return loadSection(ReportSectionGroup.OVERVIEW, scheme, startDate, FundReportOverviewSection.class);
    }

    @Override
    public ReportSectionEnvelope<FundReportPerformanceSection> getPerformance(String scheme, String startDate) {
        return loadSection(ReportSectionGroup.PERFORMANCE, scheme, startDate, FundReportPerformanceSection.class);
    }

    @Override
    public ReportSectionEnvelope<FundReportRiskSection> getRisk(String scheme, String startDate) {
        return loadSection(ReportSectionGroup.RISK, scheme, startDate, FundReportRiskSection.class);
    }

    @Override
    public ReportSectionEnvelope<FundReportInvestmentSection> getInvestment(String scheme, String startDate) {
        return loadSection(ReportSectionGroup.INVESTMENT, scheme, startDate, FundReportInvestmentSection.class);
    }

    @Override
    public ReportSectionEnvelope<FundReportAssessmentSection> getAssessment(String scheme, String startDate) {
        return loadSection(ReportSectionGroup.ASSESSMENT, scheme, startDate, FundReportAssessmentSection.class);
    }

    private <T> ReportSectionEnvelope<T> loadSection(
            ReportSectionGroup group,
            String scheme,
            String startDate,
            Class<T> payloadType) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = reportDataCoordinator.resolveStartDate(startDate);
        NavFreshness navFreshness = navHistoryPort.navFreshness(scheme);

        Optional<FundReportSectionSnapshot> stored =
                sectionSnapshotPort.find(scheme, resolvedStart, group);

        if (stored.isPresent() && isUsableSectionSnapshot(stored.get(), group, payloadType)) {
            T payload = FundReportSectionSnapshotMapper.readPayload(
                    stored.get().payloadJson(), payloadType, objectMapper);
            if (isFresh(stored.get().watermarkNavDate(), navFreshness)
                    && !storedOverviewBenchmarkStale(group, payload, scheme, resolvedStart)) {
                return envelope(payload, ReportFreshness.FRESH, stored.get());
            }
            if (navFreshness.upstreamCheckDue() || storedOverviewBenchmarkStale(group, payload, scheme, resolvedStart)) {
                return reloadSectionAfterRefresh(group, scheme, resolvedStart, payloadType);
            }
            scheduleRefresh(scheme, resolvedStart);
            ReportFreshness freshness = refreshingKeys.contains(refreshKey(scheme, resolvedStart))
                    ? ReportFreshness.REFRESHING
                    : ReportFreshness.STALE;
            return envelope(payload, freshness, stored.get());
        }

        ReportDataCoordinator.PreparedReport prepared =
                reportDataCoordinator.prepare(scheme, resolvedStart);
        T payload = materializeSection(group, scheme, resolvedStart, prepared, payloadType);
        FundReportSectionSnapshot saved = sectionSnapshotPort.find(scheme, resolvedStart, group)
                .orElseThrow(() -> new IllegalStateException("Section snapshot missing after save"));
        return envelope(payload, ReportFreshness.FRESH, saved);
    }

    private <T> boolean isUsableSectionSnapshot(
            FundReportSectionSnapshot stored,
            ReportSectionGroup group,
            Class<T> payloadType) {
        if (stored.schemaVersion() != ReportDataCoordinator.REPORT_SCHEMA_VERSION) {
            return false;
        }
        T payload = FundReportSectionSnapshotMapper.readPayload(
                stored.payloadJson(), payloadType, objectMapper);
        if (group == ReportSectionGroup.RISK && payload instanceof FundReportRiskSection riskSection) {
            return riskSection.bestDays() != null
                    && riskSection.allTimeHighs() != null
                    && riskSection.allTimeHighs().postAthReturns() != null
                    && riskSection.allTimeHighs().athDeclineOutlook() != null;
        }
        if (group == ReportSectionGroup.PERFORMANCE && payload instanceof FundReportPerformanceSection performanceSection) {
            return performanceSection.calendarYearInsights() != null;
        }
        return payload != null;
    }

    private static boolean isFresh(
            java.time.Instant storedWatermark,
            NavFreshness navFreshness) {
        return navFreshness.matchesSnapshot(storedWatermark);
    }

    private boolean storedOverviewBenchmarkStale(
            ReportSectionGroup group,
            FundReportSectionSnapshot stored,
            ReportDataCoordinator.PreparedReport prepared) {
        if (group != ReportSectionGroup.OVERVIEW) {
            return false;
        }
        FundReportOverviewSection overview = FundReportSectionSnapshotMapper.readPayload(
                stored.payloadJson(), FundReportOverviewSection.class, objectMapper);
        return overviewBenchmarkRepairDue(overview.profile().benchmarkName(), prepared.report().profile().benchmarkName());
    }

    private <T> boolean storedOverviewBenchmarkStale(
            ReportSectionGroup group,
            T payload,
            String scheme,
            String startDate) {
        if (group != ReportSectionGroup.OVERVIEW || !(payload instanceof FundReportOverviewSection overview)) {
            return false;
        }
        if (!BENCHMARK_UNAVAILABLE.equals(overview.profile().benchmarkName())) {
            return false;
        }
        NavHistory history = navHistoryPort.fetch(scheme, startDate);
        return overviewBenchmarkRepairDue(overview.profile().benchmarkName(), history.benchmarkName());
    }

    private static boolean overviewBenchmarkRepairDue(String storedBenchmark, String currentBenchmark) {
        if (!BENCHMARK_UNAVAILABLE.equals(storedBenchmark)) {
            return false;
        }
        return currentBenchmark != null && !BENCHMARK_UNAVAILABLE.equals(currentBenchmark);
    }

    private <T> T materializeSection(
            ReportSectionGroup group,
            String scheme,
            String startDate,
            ReportDataCoordinator.PreparedReport prepared,
            Class<T> payloadType) {
        String batchKey = "section-batch:" + scheme + ":" + startDate;
        singleFlightCoordinator.run(batchKey, () -> {
            materializeAllSections(scheme, startDate, prepared);
            return null;
        });
        FundReportSectionSnapshot snapshot = sectionSnapshotPort.find(scheme, startDate, group)
                .orElseThrow(() -> new IllegalStateException("Section snapshot missing after batch save"));
        return FundReportSectionSnapshotMapper.readPayload(
                snapshot.payloadJson(), payloadType, objectMapper);
    }

    private void materializeAllSections(
            String scheme,
            String startDate,
            ReportDataCoordinator.PreparedReport prepared) {
        for (ReportSectionGroup group : ReportSectionGroup.values()) {
            Optional<FundReportSectionSnapshot> existing =
                    sectionSnapshotPort.find(scheme, startDate, group);
            if (existing.isPresent()
                    && isUsableSectionSnapshot(existing.get(), group, sectionPayloadType(group))
                    && Objects.equals(existing.get().watermarkNavDate(), prepared.lastNavDate())
                    && !storedOverviewBenchmarkStale(group, existing.get(), prepared)) {
                continue;
            }
            Object payload = FundReportSectionExtractor.extract(group, prepared.report());
            persistSection(
                    group,
                    scheme,
                    startDate,
                    payload,
                    prepared,
                    existing.map(FundReportSectionSnapshot::version).orElse(0L));
        }
    }

    private static Class<?> sectionPayloadType(ReportSectionGroup group) {
        return switch (group) {
            case OVERVIEW -> FundReportOverviewSection.class;
            case PERFORMANCE -> FundReportPerformanceSection.class;
            case RISK -> FundReportRiskSection.class;
            case INVESTMENT -> FundReportInvestmentSection.class;
            case ASSESSMENT -> FundReportAssessmentSection.class;
        };
    }

    private <T> ReportSectionEnvelope<T> reloadSectionAfterRefresh(
            ReportSectionGroup group,
            String scheme,
            String startDate,
            Class<T> payloadType) {
        String key = refreshKey(scheme, startDate);
        singleFlightCoordinator.run(key, () -> {
            ReportDataCoordinator.PreparedReport prepared =
                    reportDataCoordinator.prepareRefreshed(scheme, startDate);
            materializeAllSections(scheme, startDate, prepared);
            reportDataCoordinator.evictReportCaches(scheme, startDate);
            return null;
        });

        FundReportSectionSnapshot saved = sectionSnapshotPort.find(scheme, startDate, group)
                .orElseThrow(() -> new IllegalStateException("Section snapshot missing after refresh"));
        T payload = FundReportSectionSnapshotMapper.readPayload(
                saved.payloadJson(), payloadType, objectMapper);
        NavFreshness navFreshness = navHistoryPort.navFreshness(scheme);
        ReportFreshness freshness = isFresh(saved.watermarkNavDate(), navFreshness)
                ? ReportFreshness.FRESH
                : ReportFreshness.STALE;
        return envelope(payload, freshness, saved);
    }

    private void scheduleRefresh(String scheme, String startDate) {
        String key = refreshKey(scheme, startDate);
        if (!refreshingKeys.add(key)) {
            return;
        }
        computeExecutor.execute(() -> {
            try {
                singleFlightCoordinator.run(key, () -> {
                    ReportDataCoordinator.PreparedReport prepared =
                            reportDataCoordinator.prepareRefreshed(scheme, startDate);
                    materializeAllSections(scheme, startDate, prepared);
                    reportDataCoordinator.evictReportCaches(scheme, startDate);
                    return null;
                });
            } finally {
                refreshingKeys.remove(key);
            }
        });
    }

    private void persistSection(
            ReportSectionGroup group,
            String scheme,
            String startDate,
            Object payload,
            ReportDataCoordinator.PreparedReport prepared,
            long version) {
        sectionSnapshotPort.save(new FundReportSectionSnapshot(
                scheme,
                startDate,
                group,
                FundReportSectionSnapshotMapper.writePayload(payload, objectMapper),
                prepared.lastNavDate(),
                prepared.computedAt(),
                ReportDataCoordinator.REPORT_SCHEMA_VERSION,
                version));
    }

    private static String refreshKey(String scheme, String startDate) {
        return "section-refresh:" + scheme + ":" + startDate;
    }

    private static <T> ReportSectionEnvelope<T> envelope(
            T payload,
            ReportFreshness freshness,
            FundReportSectionSnapshot snapshot) {
        return new ReportSectionEnvelope<>(
                payload,
                freshness,
                snapshot.watermarkNavDate(),
                snapshot.computedAt(),
                snapshot.schemaVersion());
    }
}
