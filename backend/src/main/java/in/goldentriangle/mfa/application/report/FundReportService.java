package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.domain.analytics.report.matrix.MatrixRecoveryAnalyzer;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReportBundle;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.stereotype.Service;

import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.domain.analytics.report.core.FundReportEngine;
import in.goldentriangle.mfa.domain.model.report.FundReport;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

@Service
public class FundReportService implements GetFundReportUseCase {

    /** Bumped when matrix caches recovery analysis with snapshot reuse. */
    private static final String MATRIX_CACHE_PREFIX = "fund-report-matrix:v5:";

    private final NavHistoryPort navHistoryPort;
    private final FundReportEngine fundReportEngine;
    private final MatrixSnapshotPort matrixSnapshotPort;
    private final ReportDataCoordinator reportDataCoordinator;
    private final FeatureGuard featureGuard;
    private final FeatureFlags featureFlags;
    private final CachePort cachePort;
    private final Clock clock;

    public FundReportService(
            NavHistoryPort navHistoryPort,
            FundReportEngine fundReportEngine,
            MatrixSnapshotPort matrixSnapshotPort,
            ReportDataCoordinator reportDataCoordinator,
            FeatureGuard featureGuard,
            FeatureFlags featureFlags,
            CachePort cachePort,
            Clock clock) {
        this.navHistoryPort = navHistoryPort;
        this.fundReportEngine = fundReportEngine;
        this.matrixSnapshotPort = matrixSnapshotPort;
        this.reportDataCoordinator = reportDataCoordinator;
        this.featureGuard = featureGuard;
        this.featureFlags = featureFlags;
        this.cachePort = cachePort;
        this.clock = clock;
    }

    @Override
    public FundReport get(String scheme, String startDate) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = reportDataCoordinator.resolveStartDate(startDate);
        String cacheKey = ReportDataCoordinator.REPORT_CACHE_PREFIX + scheme + ":" + resolvedStart;
        return cachePort.getOrLoad(
                cacheKey,
                FundReport.class,
                () -> reportDataCoordinator.prepare(scheme, resolvedStart).report());
    }

    @Override
    public MatrixReportBundle getMatrix(String scheme, String startDate, MatrixMode mode) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = reportDataCoordinator.resolveStartDate(startDate);
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

    private record CachedMatrix(
            MatrixReport report,
            MatrixRecoveryAnalysis recovery,
            Instant lastNavDate,
            Instant computedAt,
            boolean fromSnapshot) {
    }
}
