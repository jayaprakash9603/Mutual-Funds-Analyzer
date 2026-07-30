package in.goldentriangle.mfa.domain.analytics.report.risk;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport.PeriodVolatility;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VolatilityCalculatorTest {

    private final VolatilityCalculator calculator = new VolatilityCalculator();

    @Test
    void allFrequenciesProduceObservationsForDailyHistory() {
        List<NavPoint> nav = buildDailyNav(400, 0.0005);

        VolatilityReport report = calculator.compute(nav, List.of());
        assertEquals(3, report.periods().size());
        assertTrue(report.periods().stream().allMatch(period -> period.observations() > 0));
    }

    @Test
    void worstDayIsAttributedToInjectedShock() {
        List<NavPoint> nav = buildDailyNav(400, 0.0005);
        Instant shockDate = nav.get(200).date();
        nav = new ArrayList<>(nav);
        nav.set(200, new NavPoint(shockDate, nav.get(199).nav() * 0.88));

        VolatilityReport report = calculator.compute(nav, List.of());
        PeriodVolatility daily = report.periods().get(0);

        assertTrue(daily.worstReturnPercent() <= -10, "Injected shock should produce a large daily loss");
        assertEquals(formatDay(shockDate), daily.worstReturnDate());
    }

    @Test
    void distributionCountsSumToDailyObservations() {
        List<NavPoint> nav = buildDailyNav(300, 0.001);

        VolatilityReport report = calculator.compute(nav, List.of());
        PeriodVolatility daily = report.periods().get(0);
        int bucketTotal = report.dailyDistribution().stream().mapToInt(b -> b.count()).sum();

        assertEquals(daily.observations(), bucketTotal);
        assertFalse(report.dailyDistribution().isEmpty());
    }

    @Test
    void emptyInputReturnsZeroedReport() {
        VolatilityReport report = calculator.compute(List.of(), List.of());

        assertTrue(report.periods().isEmpty());
        assertTrue(report.rollingSeries().isEmpty());
        assertFalse(report.benchmarkAvailable());
        assertEquals("Insufficient history for volatility analysis", report.headline());
    }

    private static List<NavPoint> buildSmoothMonthlyNav(int months, double monthlyGrowth) {
        List<NavPoint> nav = new ArrayList<>();
        Instant cursor = Instant.parse("2015-01-01T00:00:00Z");
        double value = 100;
        for (int month = 0; month < months; month++) {
            nav.add(new NavPoint(cursor, value));
            value *= 1 + monthlyGrowth;
            cursor = cursor.atZone(ZoneOffset.UTC).plusMonths(1).toInstant();
        }
        return nav;
    }

    private static List<NavPoint> buildDailyNav(int days, double dailyGrowth) {
        List<NavPoint> nav = new ArrayList<>();
        Instant cursor = Instant.parse("2015-01-01T00:00:00Z");
        double value = 100;
        for (int day = 0; day < days; day++) {
            nav.add(new NavPoint(cursor, value));
            value *= 1 + dailyGrowth;
            cursor = cursor.atZone(ZoneOffset.UTC).plusDays(1).toInstant();
        }
        return nav;
    }

    private static String formatDay(Instant instant) {
        return java.time.format.DateTimeFormatter.ofPattern("d MMM yyyy", java.util.Locale.ENGLISH)
                .format(instant.atZone(ZoneOffset.UTC));
    }
}
