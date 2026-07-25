package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.ReportProperties;
import in.goldentriangle.mfa.domain.analytics.report.FundReportEngine;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundMetadataPort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
public class FundReportService implements GetFundReportUseCase {

    /** Bumped when report uses mfapi NAV + locally computed rolling returns. */
    private static final String REPORT_CACHE_PREFIX = "fund-report:v5:";
    /** Bumped when matrix uses mfapi daily NAV history. */
    private static final String MATRIX_CACHE_PREFIX = "fund-report-matrix:v3:";

    private final NavHistoryPort navHistoryPort;
    private final FundRollingReturnsAssembler rollingReturnsAssembler;
    private final FundMetadataPort fundMetadataPort;
    private final FundReportEngine fundReportEngine;
    private final FeatureGuard featureGuard;
    private final ReportProperties reportProperties;
    private final CachePort cachePort;
    private final Clock clock;

    public FundReportService(
            NavHistoryPort navHistoryPort,
            FundRollingReturnsAssembler rollingReturnsAssembler,
            FundMetadataPort fundMetadataPort,
            FundReportEngine fundReportEngine,
            FeatureGuard featureGuard,
            ReportProperties reportProperties,
            CachePort cachePort,
            Clock clock) {
        this.navHistoryPort = navHistoryPort;
        this.rollingReturnsAssembler = rollingReturnsAssembler;
        this.fundMetadataPort = fundMetadataPort;
        this.fundReportEngine = fundReportEngine;
        this.featureGuard = featureGuard;
        this.reportProperties = reportProperties;
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
        RollingReturnsData rollingData = rollingReturnsAssembler.assembleFromHistory(history, scheme, startDate);
        if (rollingData.fund().isEmpty()) {
            throw new NoDataFoundException("No rolling return data found for " + scheme);
        }
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
