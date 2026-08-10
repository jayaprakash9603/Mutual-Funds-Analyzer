package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.ReportProperties;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarReturnsCalculator;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarReturnsReport;
import in.goldentriangle.mfa.domain.port.in.GetCalendarReturnsUseCase;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CalendarReturnsService implements GetCalendarReturnsUseCase {

    static final String CACHE_PREFIX = "calendar-returns:v2:";

    private final NavHistoryPort navHistoryPort;
    private final CalendarReturnsCalculator calendarReturnsCalculator;
    private final FeatureGuard featureGuard;
    private final ReportProperties reportProperties;
    private final CachePort cachePort;

    public CalendarReturnsService(
            NavHistoryPort navHistoryPort,
            CalendarReturnsCalculator calendarReturnsCalculator,
            FeatureGuard featureGuard,
            ReportProperties reportProperties,
            CachePort cachePort) {
        this.navHistoryPort = navHistoryPort;
        this.calendarReturnsCalculator = calendarReturnsCalculator;
        this.featureGuard = featureGuard;
        this.reportProperties = reportProperties;
        this.cachePort = cachePort;
    }

    @Override
    public CalendarReturnsReport get(String scheme, String startDate) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_REPORT);
        String resolvedStart = resolveStartDate(startDate);
        String cacheKey = CACHE_PREFIX + scheme + ":" + resolvedStart;
        return cachePort.getOrLoad(cacheKey, CalendarReturnsReport.class, () -> compute(scheme, resolvedStart));
    }

    private CalendarReturnsReport compute(String scheme, String startDate) {
        NavHistory history = navHistoryPort.fetch(scheme, startDate);
        if (history.fundNav() == null || history.fundNav().isEmpty()) {
            throw new NoDataFoundException("No NAV history available for " + scheme);
        }
        List<NavPoint> benchmarkNav =
                history.benchmarkNav() == null ? List.of() : history.benchmarkNav();
        return calendarReturnsCalculator.compute(history.fundNav(), benchmarkNav);
    }

    private String resolveStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return reportProperties.earliestStartDate();
        }
        return startDate;
    }
}
