package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalendarYearInsightsCalculatorTest {

    private final CalendarYearInsightsCalculator calculator = new CalendarYearInsightsCalculator();

    @Test
    void buildsDistributionAndSortedReturns() {
        ConsistencyReport consistency = new ConsistencyReport(
                List.of(
                        year(2018, 22),
                        year(2019, -8),
                        year(2020, 14),
                        year(2021, 35),
                        year(2022, -12)),
                List.of(),
                -12,
                35,
                0,
                0,
                2,
                1,
                "Good");

        List<NavPoint> nav = List.of(
                point("2018-01-01", 100),
                point("2022-12-31", 140));

        var report = calculator.compute(nav, consistency);

        assertFalse(report.distribution().buckets().isEmpty());
        assertTrue(report.distribution().positiveYearsPercent() > 0);
        assertFalse(report.sortedReturns().years().isEmpty());
        assertTrue(report.sortedReturns().years().get(0).returnPercent() >= report.sortedReturns().years().get(1).returnPercent());
    }

    private static ConsistencyReport.CalendarYearReturn year(int year, double ret) {
        return new ConsistencyReport.CalendarYearReturn(year, ret, -5);
    }

    private static NavPoint point(String iso, double nav) {
        return new NavPoint(Instant.parse(iso + "T00:00:00Z"), nav);
    }
}
