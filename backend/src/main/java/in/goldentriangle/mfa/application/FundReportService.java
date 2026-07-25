package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.ReportProperties;
import in.goldentriangle.mfa.config.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.report.FundReportEngine;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
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
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;

@Service
public class FundReportService implements GetFundReportUseCase {

    private static final String REPORT_CACHE_PREFIX = "fund-report:v2:";
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

    public FundReportService(
            NavHistoryPort navHistoryPort,
            RollingReturnsPort rollingReturnsPort,
            FundMetadataPort fundMetadataPort,
            FundReportEngine fundReportEngine,
            FeatureGuard featureGuard,
            ReportProperties reportProperties,
            UpstreamProperties upstreamProperties,
            CachePort cachePort,
            Clock clock) {
        this.navHistoryPort = navHistoryPort;
        this.rollingReturnsPort = rollingReturnsPort;
        this.fundMetadataPort = fundMetadataPort;
        this.fundReportEngine = fundReportEngine;
        this.featureGuard = featureGuard;
        this.reportProperties = reportProperties;
        this.upstreamProperties = upstreamProperties;
        this.cachePort = cachePort;
        this.clock = clock;
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
        RollingReturnsData rollingData = rollingReturnsPort.fetch(
                new AnalysisQuery(scheme, Period.FIVE_YEAR, startDate));
        return fundReportEngine.build(
                history,
                rollingData,
                fundMetadataPort.fetch(scheme),
                Instant.now(clock));
    }

    private String resolveStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return reportProperties.earliestStartDate();
        }
        return startDate;
    }
}
