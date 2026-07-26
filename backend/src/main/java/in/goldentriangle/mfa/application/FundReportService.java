package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.FeatureFlags;
import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.ReportProperties;
import in.goldentriangle.mfa.domain.analytics.report.FundReportEngine;
import in.goldentriangle.mfa.domain.analytics.report.MatrixRecoveryAnalyzer;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.FundReportSnapshot;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.FundMetadata;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.MatrixReportBundle;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundMetadataPort;
import in.goldentriangle.mfa.domain.port.out.FundReportSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
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
public class FundReportService implements GetFundReportUseCase {

    /** Bumped when rolling stats add stdDev + count per period. */
    private static final String REPORT_CACHE_PREFIX = "fund-report:v8:";
    /** Bumped when matrix caches recovery analysis with snapshot reuse. */
    private static final String MATRIX_CACHE_PREFIX = "fund-report-matrix:v5:";

    private final NavHistoryPort navHistoryPort;
    private final FundRollingReturnsAssembler rollingReturnsAssembler;
    private final FundMetadataPort fundMetadataPort;
    private final FundReportEngine fundReportEngine;
    private final MatrixSnapshotPort matrixSnapshotPort;
    private final FundReportSnapshotPort reportSnapshotPort;
    private final FeatureGuard featureGuard;
    private final FeatureFlags featureFlags;
    private final ReportProperties reportProperties;
    private final CachePort cachePort;
    private final Clock clock;
    private final Executor matrixExecutor;

    public FundReportService(
            NavHistoryPort navHistoryPort,
            FundRollingReturnsAssembler rollingReturnsAssembler,
            FundMetadataPort fundMetadataPort,
            FundReportEngine fundReportEngine,
            MatrixSnapshotPort matrixSnapshotPort,
            FundReportSnapshotPort reportSnapshotPort,
            FeatureGuard featureGuard,
            FeatureFlags featureFlags,
            ReportProperties reportProperties,
            CachePort cachePort,
            Clock clock,
            @Qualifier("matrixExecutor") Executor matrixExecutor) {
        this.navHistoryPort = navHistoryPort;
        this.rollingReturnsAssembler = rollingReturnsAssembler;
        this.fundMetadataPort = fundMetadataPort;
        this.fundReportEngine = fundReportEngine;
        this.matrixSnapshotPort = matrixSnapshotPort;
        this.reportSnapshotPort = reportSnapshotPort;
        this.featureGuard = featureGuard;
        this.featureFlags = featureFlags;
        this.reportProperties = reportProperties;
        this.cachePort = cachePort;
        this.clock = clock;
        this.matrixExecutor = matrixExecutor;
    }

    @Override
    public FundReport get(String scheme, String startDate) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = resolveStartDate(startDate);
        String cacheKey = REPORT_CACHE_PREFIX + scheme + ":" + resolvedStart;
        return cachePort.getOrLoad(cacheKey, FundReport.class, () -> buildReport(scheme, resolvedStart));
    }

    @Override
    public MatrixReportBundle getMatrix(String scheme, String startDate, MatrixMode mode) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = resolveStartDate(startDate);
        String cacheKey = MATRIX_CACHE_PREFIX + scheme + ":" + resolvedStart + ":" + mode.name();
        CachedMatrix cached = cachePort.getOrLoad(cacheKey, CachedMatrix.class, () -> buildMatrix(scheme, resolvedStart, mode));
        return new MatrixReportBundle(
                cached.report(),
                cached.recovery(),
                cached.lastNavDate(),
                cached.computedAt(),
                cached.fromSnapshot());
    }

    private CachedMatrix buildMatrix(String scheme, String startDate, MatrixMode mode) {
        NavHistory history = navHistoryPort.fetch(scheme, startDate);
        Instant lastNavDate = history.lastNavDate();
        boolean snapshotsEnabled = featureFlags.getAnalysis().isIncrementalMatrixSnapshots();

        Optional<MatrixSnapshot> stored = snapshotsEnabled
                ? matrixSnapshotPort.find(scheme, mode, startDate)
                : Optional.empty();

        MatrixReport report;
        Instant computedAt;
        boolean fromSnapshot;

        if (stored.isPresent() && Objects.equals(stored.get().watermarkNavDate(), lastNavDate)) {
            report = stored.get().report();
            computedAt = stored.get().computedAt();
            fromSnapshot = true;
        } else {
            report = fundReportEngine.buildMatrix(history, mode);
            computedAt = Instant.now(clock);
            fromSnapshot = false;
            if (snapshotsEnabled) {
                matrixSnapshotPort.save(new MatrixSnapshot(
                        scheme,
                        mode,
                        startDate,
                        report,
                        lastNavDate,
                        computedAt,
                        stored.map(MatrixSnapshot::version).orElse(0L)));
            }
        }

        MatrixRecoveryAnalysis recovery = MatrixRecoveryAnalyzer.analyze(report);
        return new CachedMatrix(report, recovery, lastNavDate, computedAt, fromSnapshot);
    }

    private FundReport buildReport(String scheme, String startDate) {
        CompletableFuture<Optional<FundMetadata>> metadataFuture =
                CompletableFuture.supplyAsync(() -> fundMetadataPort.fetch(scheme), matrixExecutor);
        NavHistory history = navHistoryPort.fetch(scheme, startDate);
        Instant lastNavDate = history.lastNavDate();
        boolean snapshotsEnabled = featureFlags.getAnalysis().isPersistFundReport();

        Optional<FundReportSnapshot> stored = snapshotsEnabled
                ? reportSnapshotPort.find(scheme, startDate)
                : Optional.empty();

        if (stored.isPresent() && Objects.equals(stored.get().watermarkNavDate(), lastNavDate)) {
            return stored.get().report();
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
                    stored.map(FundReportSnapshot::version).orElse(0L)));
        }
        return report;
    }

    private String resolveStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return reportProperties.earliestStartDate();
        }
        return startDate;
    }

    private record CachedMatrix(
            MatrixReport report,
            MatrixRecoveryAnalysis recovery,
            Instant lastNavDate,
            Instant computedAt,
            boolean fromSnapshot) {
    }
}
