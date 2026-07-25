package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.ReportProperties;
import in.goldentriangle.mfa.config.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.report.FundReportEngine;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundMetadataPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class FundReportService implements GetFundReportUseCase {

    private static final Logger log = LoggerFactory.getLogger(FundReportService.class);

    /** Bumped when multi-period rolling returns are included in the report payload. */
    private static final String REPORT_CACHE_PREFIX = "fund-report:v4:";
    /** Bumped when matrix NAV lookup semantics change so stale empty grids are not reused. */
    private static final String MATRIX_CACHE_PREFIX = "fund-report-matrix:v2:";

    private final NavHistoryPort navHistoryPort;
    private final RollingReturnsPort rollingReturnsPort;
    private final FundMetadataPort fundMetadataPort;
    private final FundReportEngine fundReportEngine;
    private final FeatureGuard featureGuard;
    private final ReportProperties reportProperties;
    private final UpstreamProperties upstreamProperties;
    private final CachePort cachePort;
    private final Clock clock;
    private final Executor matrixExecutor;

    public FundReportService(
            NavHistoryPort navHistoryPort,
            RollingReturnsPort rollingReturnsPort,
            FundMetadataPort fundMetadataPort,
            FundReportEngine fundReportEngine,
            FeatureGuard featureGuard,
            ReportProperties reportProperties,
            UpstreamProperties upstreamProperties,
            CachePort cachePort,
            Clock clock,
            @Qualifier("matrixExecutor") Executor matrixExecutor) {
        this.navHistoryPort = navHistoryPort;
        this.rollingReturnsPort = rollingReturnsPort;
        this.fundMetadataPort = fundMetadataPort;
        this.fundReportEngine = fundReportEngine;
        this.featureGuard = featureGuard;
        this.reportProperties = reportProperties;
        this.upstreamProperties = upstreamProperties;
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
    public MatrixReport getMatrix(String scheme, String startDate, MatrixMode mode) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = resolveStartDate(startDate);
        String cacheKey = MATRIX_CACHE_PREFIX + scheme + ":" + resolvedStart + ":" + mode.name();
        return cachePort.getOrLoad(cacheKey, MatrixReport.class, () -> {
            NavHistory history = navHistoryPort.fetch(scheme, resolvedStart);
            return fundReportEngine.buildMatrix(history, mode);
        });
    }

    private FundReport buildReport(String scheme, String startDate) {
        NavHistory history = navHistoryPort.fetch(scheme, startDate);
        RollingReturnsData rollingData = fetchAllPeriodRolling(scheme, startDate);
        return fundReportEngine.build(
                history,
                rollingData,
                fundMetadataPort.fetch(scheme),
                Instant.now(clock));
    }

    /**
     * Upstream returns one period per call. Fetch every supported window in parallel and merge
     * so the Rolling Returns section can show 1Y–15Y cards.
     */
    private RollingReturnsData fetchAllPeriodRolling(String scheme, String startDate) {
        List<CompletableFuture<RollingReturnsData>> futures = Arrays.stream(Period.values())
                .map(period -> CompletableFuture.supplyAsync(
                        () -> fetchPeriodQuietly(scheme, startDate, period),
                        matrixExecutor))
                .toList();

        List<RollingReturnRow> fund = new ArrayList<>();
        List<RollingReturnRow> benchmark = new ArrayList<>();
        for (CompletableFuture<RollingReturnsData> future : futures) {
            RollingReturnsData part = future.join();
            if (part == null) {
                continue;
            }
            fund.addAll(part.fund());
            benchmark.addAll(part.benchmark());
        }

        if (fund.isEmpty()) {
            throw new NoDataFoundException("No rolling return data found for " + scheme);
        }
        return new RollingReturnsData(List.copyOf(fund), List.copyOf(benchmark));
    }

    private RollingReturnsData fetchPeriodQuietly(String scheme, String startDate, Period period) {
        try {
            return rollingReturnsPort.fetch(new AnalysisQuery(scheme, period, startDate));
        } catch (RuntimeException ex) {
            log.warn("Skipping rolling period {} for {}: {}", period.label(), scheme, ex.getMessage());
            return null;
        }
    }

    private String resolveStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return reportProperties.earliestStartDate();
        }
        return startDate;
    }
}
