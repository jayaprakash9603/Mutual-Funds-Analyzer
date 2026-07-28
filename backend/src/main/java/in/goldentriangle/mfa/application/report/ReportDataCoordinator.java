package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.properties.ReportProperties;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.config.metrics.ReportComputeMetrics;
import in.goldentriangle.mfa.domain.analytics.report.core.FundReportEngine;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.FundReportSnapshot;
import in.goldentriangle.mfa.domain.model.NavFreshness;
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
    /** Bumped when SIP timeline uses daily NAV dates instead of monthly instalments only. */
    public static final int REPORT_SCHEMA_VERSION = 8;

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
    private final ReportComputeMetrics reportComputeMetrics;

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
            SingleFlightCoordinator singleFlightCoordinator,
            ReportComputeMetrics reportComputeMetrics) {
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
        this.reportComputeMetrics = reportComputeMetrics;
    }

    public PreparedReport prepare(String scheme, String startDate) {
        String resolvedStart = resolveStartDate(startDate);
        String flightKey = "report-prepare:" + scheme + ":" + resolvedStart;
        return singleFlightCoordinator.run(flightKey, () -> {
            String cacheKey = CONTEXT_CACHE_PREFIX + scheme + ":" + resolvedStart;
            return cachePort.getOrLoad(cacheKey, PreparedReport.class, () -> buildPrepared(scheme, resolvedStart, false));
        });
    }

    public PreparedReport prepareRefreshed(String scheme, String startDate) {
        String resolvedStart = resolveStartDate(startDate);
        evictContextCache(scheme, resolvedStart);
        String flightKey = "report-prepare-refresh:" + scheme + ":" + resolvedStart;
        return singleFlightCoordinator.run(flightKey, () -> buildPrepared(scheme, resolvedStart, true));
    }

    public NavFreshness resolveNavFreshness(String scheme) {
        return navHistoryPort.navFreshness(scheme);
    }

    public void evictReportCaches(String scheme, String startDate) {
        String resolvedStart = resolveStartDate(startDate);
        cachePort.evict(REPORT_CACHE_PREFIX + scheme + ":" + resolvedStart);
        evictContextCache(scheme, resolvedStart);
    }

    public String resolveStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return reportProperties.earliestStartDate();
        }
        return startDate;
    }

    private void evictContextCache(String scheme, String resolvedStart) {
        cachePort.evict(CONTEXT_CACHE_PREFIX + scheme + ":" + resolvedStart);
    }

    private PreparedReport buildPrepared(String scheme, String startDate, boolean forceRefresh) {
        boolean snapshotsEnabled = featureFlags.getAnalysis().isPersistFundReport();
        Optional<FundReportSnapshot> stored = snapshotsEnabled && !forceRefresh
                ? reportSnapshotPort.find(scheme, startDate)
                : Optional.empty();
        NavFreshness navFreshness = navHistoryPort.navFreshness(scheme);

        if (!forceRefresh
                && stored.isPresent()
                && stored.get().schemaVersion() == REPORT_SCHEMA_VERSION
                && watermarkMatches(stored.get().watermarkNavDate(), navFreshness)) {
            return new PreparedReport(
                    stored.get().report(),
                    stored.get().watermarkNavDate(),
                    stored.get().computedAt(),
                    true);
        }

        CompletableFuture<Optional<FundMetadata>> metadataFuture =
                CompletableFuture.supplyAsync(() -> fundMetadataPort.fetch(scheme), upstreamExecutor);
        NavHistory history = forceRefresh
                ? navHistoryPort.fetchFresh(scheme, startDate)
                : navHistoryPort.fetch(scheme, startDate);
        Instant lastNavDate = history.lastNavDate();

        if (!forceRefresh
                && stored.isPresent()
                && stored.get().schemaVersion() == REPORT_SCHEMA_VERSION
                && Objects.equals(stored.get().watermarkNavDate(), lastNavDate)) {
            return new PreparedReport(
                    stored.get().report(),
                    lastNavDate,
                    stored.get().computedAt(),
                    true);
        }

        RollingReturnsData rollingData = reportComputeMetrics.time(
                "rolling.assemble",
                () -> rollingReturnsAssembler.assembleFromHistory(history, scheme, startDate));
        if (rollingData.fund().isEmpty()) {
            throw new NoDataFoundException("No rolling return data found for " + scheme);
        }
        Instant computedAt = Instant.now(clock);
        FundReport report = reportComputeMetrics.time(
                "engine.build",
                () -> fundReportEngine.build(
                        history,
                        rollingData,
                        metadataFuture.join(),
                        computedAt));

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

    static boolean watermarkMatches(Instant storedWatermark, NavFreshness navFreshness) {
        return navFreshness.matchesSnapshot(storedWatermark);
    }

    public record PreparedReport(
            FundReport report,
            Instant lastNavDate,
            Instant computedAt,
            boolean fromSnapshot) {
    }
}
