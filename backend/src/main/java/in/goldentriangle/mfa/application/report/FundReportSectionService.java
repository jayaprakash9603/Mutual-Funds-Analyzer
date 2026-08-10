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
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;
import in.goldentriangle.mfa.domain.port.in.GetFundReportSectionUseCase;
import in.goldentriangle.mfa.domain.port.out.FundReportSectionSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

@Service
public class FundReportSectionService implements GetFundReportSectionUseCase {

    private static final Logger log = LoggerFactory.getLogger(FundReportSectionService.class);
    private static final String BENCHMARK_UNAVAILABLE = "Benchmark unavailable";

    private final ReportDataCoordinator reportDataCoordinator;
    private final FundReportSectionSnapshotPort sectionSnapshotPort;
    private final NavHistoryPort navHistoryPort;
    private final FeatureGuard featureGuard;
    private final ObjectMapper objectMapper;
    private final Executor computeExecutor;
    private final SingleFlightCoordinator singleFlightCoordinator;
    private final ReportRefreshEventHub refreshEventHub;
    private final Set<String> refreshingKeys = ConcurrentHashMap.newKeySet();

    public FundReportSectionService(
            ReportDataCoordinator reportDataCoordinator,
            FundReportSectionSnapshotPort sectionSnapshotPort,
            NavHistoryPort navHistoryPort,
            FeatureGuard featureGuard,
            ObjectMapper objectMapper,
            @Qualifier("computeExecutor") Executor computeExecutor,
            SingleFlightCoordinator singleFlightCoordinator,
            ReportRefreshEventHub refreshEventHub) {
        this.reportDataCoordinator = reportDataCoordinator;
        this.sectionSnapshotPort = sectionSnapshotPort;
        this.navHistoryPort = navHistoryPort;
        this.featureGuard = featureGuard;
        this.objectMapper = objectMapper;
        this.computeExecutor = computeExecutor;
        this.singleFlightCoordinator = singleFlightCoordinator;
        this.refreshEventHub = refreshEventHub;
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
        long startedAt = System.nanoTime();
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = reportDataCoordinator.resolveStartDate(startDate);
        long afterResolve = System.nanoTime();
        NavFreshness navFreshness = navHistoryPort.navFreshness(scheme);
        long afterFreshness = System.nanoTime();

        Optional<FundReportSectionSnapshot> stored =
                sectionSnapshotPort.find(scheme, resolvedStart, group);
        long afterFind = System.nanoTime();
        if (stored.isPresent()) {
            Optional<T> payload = readServablePayload(stored.get(), group, payloadType);
            if (payload.isPresent()) {
                ReportSectionEnvelope<T> envelope = respondFromStored(
                        group, scheme, resolvedStart, payload.get(), stored.get(), navFreshness);
                logSectionTiming(
                        group,
                        scheme,
                        startedAt,
                        afterResolve,
                        afterFreshness,
                        afterFind,
                        envelope.freshness().name());
                return envelope;
            }
        }

        ReportSectionEnvelope<T> envelope =
                respondFromCold(group, scheme, resolvedStart, payloadType, navFreshness);
        logSectionTiming(
                group,
                scheme,
                startedAt,
                afterResolve,
                afterFreshness,
                afterFind,
                "COLD-" + envelope.freshness().name());
        return envelope;
    }

    private static void logSectionTiming(
            ReportSectionGroup group,
            String scheme,
            long startedAtNanos,
            long afterResolveNanos,
            long afterFreshnessNanos,
            long afterFindNanos,
            String path) {
        long elapsedMs = (System.nanoTime() - startedAtNanos) / 1_000_000L;
        if (elapsedMs < 500) {
            return;
        }
        log.info(
                "Section slow path={} group={} scheme='{}' elapsedMs={} freshnessMs={} findMs={}",
                path,
                group,
                scheme,
                elapsedMs,
                (afterFreshnessNanos - afterResolveNanos) / 1_000_000L,
                (afterFindNanos - afterFreshnessNanos) / 1_000_000L);
    }

    private <T> ReportSectionEnvelope<T> respondFromStored(
            ReportSectionGroup group,
            String scheme,
            String resolvedStart,
            T payload,
            FundReportSectionSnapshot stored,
            NavFreshness navFreshness) {
        boolean needsRefresh = needsBackgroundRefresh(group, payload, stored, navFreshness);
        if (!needsRefresh) {
            log.info(
                    "Section FRESH group={} scheme='{}' watermark={}",
                    group,
                    scheme,
                    stored.watermarkNavDate());
            return envelope(payload, ReportFreshness.FRESH, stored);
        }

        scheduleRefresh(scheme, resolvedStart);
        log.info(
                "Section STALE-SERVE group={} scheme='{}' schema={} watermark={} upstreamDue={}",
                group,
                scheme,
                stored.schemaVersion(),
                stored.watermarkNavDate(),
                navFreshness.upstreamCheckDue());
        return envelope(payload, ReportFreshness.REFRESHING, stored);
    }

    private <T> ReportSectionEnvelope<T> respondFromCold(
            ReportSectionGroup group,
            String scheme,
            String resolvedStart,
            Class<T> payloadType,
            NavFreshness navFreshness) {
        log.info(
                "Section COLD group={} scheme='{}' — local prepare then async refresh if due",
                group,
                scheme);
        ReportDataCoordinator.PreparedReport prepared =
                reportDataCoordinator.prepare(scheme, resolvedStart);
        T payload = materializeSection(group, scheme, resolvedStart, prepared, payloadType);
        FundReportSectionSnapshot saved = sectionSnapshotPort.find(scheme, resolvedStart, group)
                .orElseThrow(() -> new IllegalStateException("Section snapshot missing after save"));

        if (navFreshness.upstreamCheckDue()) {
            scheduleRefresh(scheme, resolvedStart);
            return envelope(payload, ReportFreshness.REFRESHING, saved);
        }
        return envelope(payload, ReportFreshness.FRESH, saved);
    }

    private <T> boolean needsBackgroundRefresh(
            ReportSectionGroup group,
            T payload,
            FundReportSectionSnapshot stored,
            NavFreshness navFreshness) {
        boolean schemaStale = stored.schemaVersion() != ReportDataCoordinator.REPORT_SCHEMA_VERSION;
        boolean watermarkFresh = isFresh(stored.watermarkNavDate(), navFreshness);
        boolean overviewBenchmarkStale = storedOverviewBenchmarkStale(group, payload);
        return schemaStale
                || !watermarkFresh
                || overviewBenchmarkStale
                || navFreshness.upstreamCheckDue();
    }

    private <T> Optional<T> readServablePayload(
            FundReportSectionSnapshot stored,
            ReportSectionGroup group,
            Class<T> payloadType) {
        try {
            T payload = FundReportSectionSnapshotMapper.readPayload(
                    stored.payloadJson(), payloadType, objectMapper);
            if (!hasRequiredSectionFields(group, payload)) {
                return Optional.empty();
            }
            return Optional.of(payload);
        } catch (RuntimeException ex) {
            log.warn(
                    "Section snapshot unreadable group={} scheme='{}': {}",
                    group,
                    stored.scheme(),
                    ex.getMessage());
            return Optional.empty();
        }
    }

    private <T> boolean isUsableSectionSnapshot(
            FundReportSectionSnapshot stored,
            ReportSectionGroup group,
            Class<T> payloadType) {
        if (stored.schemaVersion() != ReportDataCoordinator.REPORT_SCHEMA_VERSION) {
            return false;
        }
        return readServablePayload(stored, group, payloadType).isPresent();
    }

    private <T> boolean hasRequiredSectionFields(ReportSectionGroup group, T payload) {
        if (payload == null) {
            return false;
        }
        if (group == ReportSectionGroup.RISK && payload instanceof FundReportRiskSection riskSection) {
            return riskSection.bestDays() != null
                    && riskSection.allTimeHighs() != null
                    && riskSection.allTimeHighs().postAthReturns() != null
                    && riskSection.allTimeHighs().athDeclineOutlook() != null;
        }
        if (group == ReportSectionGroup.PERFORMANCE
                && payload instanceof FundReportPerformanceSection performanceSection) {
            return performanceSection.calendarYearInsights() != null;
        }
        return true;
    }

    private static boolean isFresh(
            java.time.Instant storedWatermark,
            NavFreshness navFreshness) {
        if (storedWatermark == null) {
            return false;
        }
        return navFreshness.watermark().isEmpty()
                || Objects.equals(storedWatermark, navFreshness.watermark().get());
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
        return overviewBenchmarkRepairDue(
                overview.profile().benchmarkName(),
                prepared.report().profile().benchmarkName());
    }

    private <T> boolean storedOverviewBenchmarkStale(ReportSectionGroup group, T payload) {
        if (group != ReportSectionGroup.OVERVIEW || !(payload instanceof FundReportOverviewSection overview)) {
            return false;
        }
        return BENCHMARK_UNAVAILABLE.equals(overview.profile().benchmarkName());
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

    private void scheduleRefresh(String scheme, String startDate) {
        String key = refreshKey(scheme, startDate);
        if (!refreshingKeys.add(key)) {
            log.info("Async report refresh already in-flight scheme='{}' startDate={}", scheme, startDate);
            return;
        }
        log.info("Async report refresh scheduled scheme='{}' startDate={}", scheme, startDate);
        try {
            computeExecutor.execute(() -> runRefresh(scheme, startDate, key));
        } catch (RejectedExecutionException ex) {
            refreshingKeys.remove(key);
            log.warn(
                    "Async report refresh rejected (compute pool full) scheme='{}' startDate={}",
                    scheme,
                    startDate);
        }
    }

    private void runRefresh(String scheme, String startDate, String key) {
        try {
            ReportDataCoordinator.PreparedReport prepared = singleFlightCoordinator.run(key, () -> {
                log.info("Async report refresh started scheme='{}' startDate={}", scheme, startDate);
                ReportDataCoordinator.PreparedReport refreshed =
                        reportDataCoordinator.prepareRefreshed(scheme, startDate);
                materializeAllSections(scheme, startDate, refreshed);
                reportDataCoordinator.evictReportCaches(scheme, startDate);
                log.info(
                        "Async report refresh completed scheme='{}' watermark={} computedAt={}",
                        scheme,
                        refreshed.lastNavDate(),
                        refreshed.computedAt());
                return refreshed;
            });
            refreshEventHub.publishReportReady(
                    scheme,
                    prepared.lastNavDate(),
                    prepared.computedAt());
        } catch (RuntimeException ex) {
            log.warn("Async report refresh failed for {}: {}", scheme, ex.getMessage());
        } finally {
            refreshingKeys.remove(key);
        }
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
