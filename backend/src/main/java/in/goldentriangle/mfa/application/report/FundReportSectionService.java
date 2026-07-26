package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.FundReportSectionSnapshotMapper;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.ReportFreshness;
import in.goldentriangle.mfa.domain.model.ReportSectionEnvelope;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;
import in.goldentriangle.mfa.domain.port.in.GetFundReportSectionUseCase;
import in.goldentriangle.mfa.domain.port.out.FundReportSectionSnapshotPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;

@Service
public class FundReportSectionService implements GetFundReportSectionUseCase {

    private final ReportDataCoordinator reportDataCoordinator;
    private final FundReportSectionSnapshotPort sectionSnapshotPort;
    private final FeatureGuard featureGuard;
    private final ObjectMapper objectMapper;
    private final Executor computeExecutor;
    private final SingleFlightCoordinator singleFlightCoordinator;
    private final Set<String> refreshingKeys = ConcurrentHashMap.newKeySet();

    public FundReportSectionService(
            ReportDataCoordinator reportDataCoordinator,
            FundReportSectionSnapshotPort sectionSnapshotPort,
            FeatureGuard featureGuard,
            ObjectMapper objectMapper,
            @Qualifier("computeExecutor") Executor computeExecutor,
            SingleFlightCoordinator singleFlightCoordinator) {
        this.reportDataCoordinator = reportDataCoordinator;
        this.sectionSnapshotPort = sectionSnapshotPort;
        this.featureGuard = featureGuard;
        this.objectMapper = objectMapper;
        this.computeExecutor = computeExecutor;
        this.singleFlightCoordinator = singleFlightCoordinator;
    }

    @Override
    public ReportSectionEnvelope<FundReportOverviewSection> getOverview(String scheme, String startDate) {
        return loadSection(
                ReportSectionGroup.OVERVIEW,
                scheme,
                startDate,
                FundReportOverviewSection.class,
                FundReportSectionExtractor::overview);
    }

    @Override
    public ReportSectionEnvelope<FundReportPerformanceSection> getPerformance(String scheme, String startDate) {
        return loadSection(
                ReportSectionGroup.PERFORMANCE,
                scheme,
                startDate,
                FundReportPerformanceSection.class,
                FundReportSectionExtractor::performance);
    }

    @Override
    public ReportSectionEnvelope<FundReportRiskSection> getRisk(String scheme, String startDate) {
        return loadSection(
                ReportSectionGroup.RISK,
                scheme,
                startDate,
                FundReportRiskSection.class,
                FundReportSectionExtractor::risk);
    }

    @Override
    public ReportSectionEnvelope<FundReportInvestmentSection> getInvestment(String scheme, String startDate) {
        return loadSection(
                ReportSectionGroup.INVESTMENT,
                scheme,
                startDate,
                FundReportInvestmentSection.class,
                FundReportSectionExtractor::investment);
    }

    @Override
    public ReportSectionEnvelope<FundReportAssessmentSection> getAssessment(String scheme, String startDate) {
        return loadSection(
                ReportSectionGroup.ASSESSMENT,
                scheme,
                startDate,
                FundReportAssessmentSection.class,
                FundReportSectionExtractor::assessment);
    }

    @FunctionalInterface
    private interface SectionExtractor<T> {
        T extract(FundReport report);
    }

    private <T> ReportSectionEnvelope<T> loadSection(
            ReportSectionGroup group,
            String scheme,
            String startDate,
            Class<T> payloadType,
            SectionExtractor<T> extractor) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = reportDataCoordinator.resolveStartDate(startDate);
        ReportDataCoordinator.PreparedReport prepared =
                reportDataCoordinator.prepare(scheme, resolvedStart);
        Instant currentWatermark = prepared.lastNavDate();

        Optional<FundReportSectionSnapshot> stored =
                sectionSnapshotPort.find(scheme, resolvedStart, group);

        if (stored.isPresent() && stored.get().schemaVersion() == ReportDataCoordinator.REPORT_SCHEMA_VERSION) {
            T payload = FundReportSectionSnapshotMapper.readPayload(
                    stored.get().payloadJson(), payloadType, objectMapper);
            if (Objects.equals(stored.get().watermarkNavDate(), currentWatermark)) {
                return envelope(payload, ReportFreshness.FRESH, stored.get());
            }
            scheduleRefresh(group, scheme, resolvedStart, stored.get().version());
            ReportFreshness freshness = refreshingKeys.contains(refreshKey(group, scheme, resolvedStart))
                    ? ReportFreshness.REFRESHING
                    : ReportFreshness.STALE;
            return envelope(payload, freshness, stored.get());
        }

        T payload = computeAndPersist(group, scheme, resolvedStart, prepared, extractor);
        FundReportSectionSnapshot saved = sectionSnapshotPort.find(scheme, resolvedStart, group)
                .orElseThrow(() -> new IllegalStateException("Section snapshot missing after save"));
        return envelope(payload, ReportFreshness.FRESH, saved);
    }

    private <T> T computeAndPersist(
            ReportSectionGroup group,
            String scheme,
            String startDate,
            ReportDataCoordinator.PreparedReport prepared,
            SectionExtractor<T> extractor) {
        String flightKey = "section-compute:" + scheme + ":" + startDate + ":" + group.name();
        return singleFlightCoordinator.run(flightKey, () -> {
            Optional<FundReportSectionSnapshot> existing =
                    sectionSnapshotPort.find(scheme, startDate, group);
            if (existing.isPresent()
                    && existing.get().schemaVersion() == ReportDataCoordinator.REPORT_SCHEMA_VERSION
                    && Objects.equals(existing.get().watermarkNavDate(), prepared.lastNavDate())) {
                return FundReportSectionSnapshotMapper.readPayload(
                        existing.get().payloadJson(), inferType(group), objectMapper);
            }
            T payload = extractor.extract(prepared.report());
            persistSection(group, scheme, startDate, payload, prepared, existing.map(FundReportSectionSnapshot::version).orElse(0L));
            return payload;
        });
    }

    @SuppressWarnings("unchecked")
    private <T> Class<T> inferType(ReportSectionGroup group) {
        return (Class<T>) switch (group) {
            case OVERVIEW -> FundReportOverviewSection.class;
            case PERFORMANCE -> FundReportPerformanceSection.class;
            case RISK -> FundReportRiskSection.class;
            case INVESTMENT -> FundReportInvestmentSection.class;
            case ASSESSMENT -> FundReportAssessmentSection.class;
        };
    }

    private void scheduleRefresh(
            ReportSectionGroup group,
            String scheme,
            String startDate,
            long version) {
        String key = refreshKey(group, scheme, startDate);
        if (!refreshingKeys.add(key)) {
            return;
        }
        computeExecutor.execute(() -> {
            try {
                singleFlightCoordinator.run(key, () -> {
                    ReportDataCoordinator.PreparedReport prepared =
                            reportDataCoordinator.prepare(scheme, startDate);
                    Object payload = FundReportSectionExtractor.extract(group, prepared.report());
                    persistSection(group, scheme, startDate, payload, prepared, version);
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

    private static String refreshKey(ReportSectionGroup group, String scheme, String startDate) {
        return "section-refresh:" + scheme + ":" + startDate + ":" + group.name();
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
