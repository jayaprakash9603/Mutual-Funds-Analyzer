package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.domain.analytics.report.matrix.MatrixRecoveryAnalyzer;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.NavFreshness;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReportBundle;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.domain.analytics.report.core.FundReportEngine;
import in.goldentriangle.mfa.domain.analytics.report.sip.SipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.SwpCalculator;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SwpSimulation;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;

@Service
public class FundReportService implements GetFundReportUseCase {

    /** Bumped when matrix fast-path / stale-while-revalidate logic changes. */
    private static final String MATRIX_CACHE_PREFIX = "fund-report-matrix:v6:";

    private final NavHistoryPort navHistoryPort;
    private final FundReportEngine fundReportEngine;
    private final SipCalculator sipCalculator;
    private final SwpCalculator swpCalculator;
    private final MatrixSnapshotPort matrixSnapshotPort;
    private final ReportDataCoordinator reportDataCoordinator;
    private final FeatureGuard featureGuard;
    private final FeatureFlags featureFlags;
    private final CachePort cachePort;
    private final Clock clock;
    private final Executor computeExecutor;
    private final SingleFlightCoordinator singleFlightCoordinator;
    private final Set<String> refreshingKeys = ConcurrentHashMap.newKeySet();

    public FundReportService(
            NavHistoryPort navHistoryPort,
            FundReportEngine fundReportEngine,
            SipCalculator sipCalculator,
            SwpCalculator swpCalculator,
            MatrixSnapshotPort matrixSnapshotPort,
            ReportDataCoordinator reportDataCoordinator,
            FeatureGuard featureGuard,
            FeatureFlags featureFlags,
            CachePort cachePort,
            Clock clock,
            @Qualifier("computeExecutor") Executor computeExecutor,
            SingleFlightCoordinator singleFlightCoordinator) {
        this.navHistoryPort = navHistoryPort;
        this.fundReportEngine = fundReportEngine;
        this.sipCalculator = sipCalculator;
        this.swpCalculator = swpCalculator;
        this.matrixSnapshotPort = matrixSnapshotPort;
        this.reportDataCoordinator = reportDataCoordinator;
        this.featureGuard = featureGuard;
        this.featureFlags = featureFlags;
        this.cachePort = cachePort;
        this.clock = clock;
        this.computeExecutor = computeExecutor;
        this.singleFlightCoordinator = singleFlightCoordinator;
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

    @Override
    public SipSimulation simulateSip(String scheme, String startDate, int amount, int scheduleDay) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = reportDataCoordinator.resolveStartDate(startDate);
        NavHistory history = navHistoryPort.fetch(scheme, resolvedStart);
        return sipCalculator.simulate(history, amount, scheduleDay);
    }

    @Override
    public SwpSimulation simulateSwp(
            String scheme,
            String startDate,
            int initialCorpus,
            int monthlyWithdrawal,
            int scheduleDay) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = reportDataCoordinator.resolveStartDate(startDate);
        NavHistory history = navHistoryPort.fetch(scheme, resolvedStart);
        return swpCalculator.simulate(history, initialCorpus, monthlyWithdrawal, scheduleDay);
    }

    private CachedMatrix buildMatrix(String scheme, String startDate, MatrixMode mode) {
        boolean snapshotsEnabled = featureFlags.getAnalysis().isIncrementalMatrixSnapshots();
        NavFreshness navFreshness = navHistoryPort.navFreshness(scheme);

        Optional<MatrixSnapshot> stored = snapshotsEnabled
                ? matrixSnapshotPort.find(scheme, mode, startDate)
                : Optional.empty();

        if (stored.isPresent()) {
            if (watermarkMatches(stored.get().watermarkNavDate(), navFreshness)) {
                return fromSnapshot(stored.get(), true);
            }
            scheduleRefresh(scheme, startDate, mode);
            return fromSnapshot(stored.get(), true);
        }

        return materializeMatrix(scheme, startDate, mode, Optional.empty(), false);
    }

    private CachedMatrix materializeMatrix(
            String scheme,
            String startDate,
            MatrixMode mode,
            Optional<MatrixSnapshot> stored,
            boolean forceFreshNav) {
        NavHistory history = forceFreshNav
                ? navHistoryPort.fetchFresh(scheme, startDate)
                : navHistoryPort.fetch(scheme, startDate);
        Instant lastNavDate = history.lastNavDate();
        boolean snapshotsEnabled = featureFlags.getAnalysis().isIncrementalMatrixSnapshots();

        Optional<MatrixSnapshot> current = stored.isPresent()
                ? stored
                : snapshotsEnabled ? matrixSnapshotPort.find(scheme, mode, startDate) : Optional.empty();

        if (current.isPresent() && Objects.equals(current.get().watermarkNavDate(), lastNavDate)) {
            return fromSnapshot(current.get(), true);
        }

        MatrixReport report = fundReportEngine.buildMatrix(history, mode);
        Instant computedAt = Instant.now(clock);
        if (snapshotsEnabled) {
            matrixSnapshotPort.save(new MatrixSnapshot(
                    scheme,
                    mode,
                    startDate,
                    report,
                    lastNavDate,
                    computedAt,
                    current.map(MatrixSnapshot::version).orElse(0L)));
        }
        return wrap(report, lastNavDate, computedAt, false);
    }

    private void scheduleRefresh(String scheme, String startDate, MatrixMode mode) {
        String key = refreshKey(scheme, startDate, mode);
        if (!refreshingKeys.add(key)) {
            return;
        }
        computeExecutor.execute(() -> {
            try {
                singleFlightCoordinator.run(key, () -> {
                    materializeMatrix(scheme, startDate, mode, Optional.empty(), true);
                    evictMatrixCache(scheme, startDate, mode);
                    reportDataCoordinator.evictReportCaches(scheme, startDate);
                    return null;
                });
            } finally {
                refreshingKeys.remove(key);
            }
        });
    }

    private void evictMatrixCache(String scheme, String startDate, MatrixMode mode) {
        cachePort.evict(MATRIX_CACHE_PREFIX + scheme + ":" + startDate + ":" + mode.name());
    }

    private static CachedMatrix fromSnapshot(MatrixSnapshot stored, boolean fromSnapshot) {
        MatrixRecoveryAnalysis recovery = MatrixRecoveryAnalyzer.analyze(stored.report());
        return new CachedMatrix(
                stored.report(),
                recovery,
                stored.watermarkNavDate(),
                stored.computedAt(),
                fromSnapshot);
    }

    private static CachedMatrix wrap(
            MatrixReport report,
            Instant lastNavDate,
            Instant computedAt,
            boolean fromSnapshot) {
        MatrixRecoveryAnalysis recovery = MatrixRecoveryAnalyzer.analyze(report);
        return new CachedMatrix(report, recovery, lastNavDate, computedAt, fromSnapshot);
    }

    private static boolean watermarkMatches(Instant storedWatermark, NavFreshness navFreshness) {
        return navFreshness.matchesSnapshot(storedWatermark);
    }

    private static String refreshKey(String scheme, String startDate, MatrixMode mode) {
        return "matrix-refresh:" + scheme + ":" + startDate + ":" + mode.name();
    }

    private record CachedMatrix(
            MatrixReport report,
            MatrixRecoveryAnalysis recovery,
            Instant lastNavDate,
            Instant computedAt,
            boolean fromSnapshot) {
    }
}
