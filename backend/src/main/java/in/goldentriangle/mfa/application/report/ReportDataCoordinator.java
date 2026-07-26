package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.properties.ReportProperties;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.domain.analytics.report.core.FundReportEngine;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.FundReportSnapshot;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.FundMetadata;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundMetadataPort;
import in.goldentriangle.mfa.domain.port.out.FundReportSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class ReportDataCoordinator {

    /** Bumped when drawdown report carries bear-market and recovery analytics. */
    public static final String REPORT_CACHE_PREFIX = "fund-report:v12:";
    /** Bumped when the persisted report shape changes; older snapshots are recomputed. */
    public static final int REPORT_SCHEMA_VERSION = 7;

    private static final String CONTEXT_CACHE_PREFIX = "report-context:v1:";

    private final NavHistoryPort navHistoryPort;
    private final FundRollingReturnsAssembler rollingReturnsAssembler;
    private final FundMetadataPort fundMetadataPort;
    private final FundReportEngine fundReportEngine;
    private final FundReportSnapshotPort reportSnapshotPort;
    private final FeatureFlags featureFlags;
    private final ReportProperties reportProperties;
    private final CachePort cachePort;
    private final Clock clock;
    private final Executor upstreamExecutor;
    private final SingleFlightCoordinator singleFlightCoordinator;

    public ReportDataCoordinator(
            NavHistoryPort navHistoryPort,
            FundRollingReturnsAssembler rollingReturnsAssembler,
            FundMetadataPort fundMetadataPort,
            FundReportEngine fundReportEngine,
            FundReportSnapshotPort reportSnapshotPort,
            FeatureFlags featureFlags,
            ReportProperties reportProperties,
            CachePort cachePort,
            Clock clock,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor,
            SingleFlightCoordinator singleFlightCoordinator) {
        this.navHistoryPort = navHistoryPort;
        this.rollingReturnsAssembler = rollingReturnsAssembler;
        this.fundMetadataPort = fundMetadataPort;
        this.fundReportEngine = fundReportEngine;
        this.reportSnapshotPort = reportSnapshotPort;
        this.featureFlags = featureFlags;
        this.reportProperties = reportProperties;
        this.cachePort = cachePort;
        this.clock = clock;
        this.upstreamExecutor = upstreamExecutor;
        this.singleFlightCoordinator = singleFlightCoordinator;
    }

    public PreparedReport prepare(String scheme, String startDate) {
        String resolvedStart = resolveStartDate(startDate);
        String flightKey = "report-prepare:" + scheme + ":" + resolvedStart;
        return singleFlightCoordinator.run(flightKey, () -> {
            String cacheKey = CONTEXT_CACHE_PREFIX + scheme + ":" + resolvedStart;
            return cachePort.getOrLoad(cacheKey, PreparedReport.class, () -> buildPrepared(scheme, resolvedStart));
        });
    }

    public Optional<Instant> resolveLiveWatermark(String scheme) {
        return navHistoryPort.latestNavWatermark(scheme);
    }

    public String resolveStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return reportProperties.earliestStartDate();
        }
        return startDate;
    }

    private PreparedReport buildPrepared(String scheme, String startDate) {
        boolean snapshotsEnabled = featureFlags.getAnalysis().isPersistFundReport();
        Optional<FundReportSnapshot> stored = snapshotsEnabled
                ? reportSnapshotPort.find(scheme, startDate)
                : Optional.empty();
        Optional<Instant> liveWatermark = navHistoryPort.latestNavWatermark(scheme);

        if (stored.isPresent()
                && stored.get().schemaVersion() == REPORT_SCHEMA_VERSION
                && watermarkMatches(stored.get().watermarkNavDate(), liveWatermark)) {
            return new PreparedReport(
                    stored.get().report(),
                    stored.get().watermarkNavDate(),
                    stored.get().computedAt(),
                    true);
        }

        CompletableFuture<Optional<FundMetadata>> metadataFuture =
                CompletableFuture.supplyAsync(() -> fundMetadataPort.fetch(scheme), upstreamExecutor);
        NavHistory history = navHistoryPort.fetch(scheme, startDate);
        Instant lastNavDate = history.lastNavDate();

        if (stored.isPresent()
                && stored.get().schemaVersion() == REPORT_SCHEMA_VERSION
                && Objects.equals(stored.get().watermarkNavDate(), lastNavDate)) {
            return new PreparedReport(
                    stored.get().report(),
                    lastNavDate,
                    stored.get().computedAt(),
                    true);
        }

        RollingReturnsData rollingData = rollingReturnsAssembler.assembleFromHistory(history, scheme, startDate);
        if (rollingData.fund().isEmpty()) {
            throw new NoDataFoundException("No rolling return data found for " + scheme);
        }
        Instant computedAt = Instant.now(clock);
        FundReport report = fundReportEngine.build(
                history,
                rollingData,
                metadataFuture.join(),
                computedAt);

        if (snapshotsEnabled) {
            reportSnapshotPort.save(new FundReportSnapshot(
                    scheme,
                    startDate,
                    report,
                    lastNavDate,
                    computedAt,
                    REPORT_SCHEMA_VERSION,
                    stored.map(FundReportSnapshot::version).orElse(0L)));
        }
        return new PreparedReport(report, lastNavDate, computedAt, false);
    }

    private static boolean watermarkMatches(Instant storedWatermark, Optional<Instant> liveWatermark) {
        if (storedWatermark == null) {
            return false;
        }
        return liveWatermark.isEmpty() || Objects.equals(storedWatermark, liveWatermark.get());
    }

    public record PreparedReport(
            FundReport report,
            Instant lastNavDate,
            Instant computedAt,
            boolean fromSnapshot) {
    }
}
