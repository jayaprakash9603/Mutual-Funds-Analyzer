package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarReturnsReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalendarReturnsCalculatorTest {

    private final CalendarReturnsCalculator calculator = new CalendarReturnsCalculator();

    @Test
    void monthlyFactorsCompoundToYearlyReturn() {
        List<NavPoint> nav = fullYearNav(2020, 100);

        CalendarReturnsReport report = calculator.compute(nav);

        assertEquals(12, report.months().size());
        assertEquals(1, report.years().size());

        CalendarReturnsReport.YearlyReturn year = report.years().get(0);
        assertEquals(2020, year.year());
        assertFalse(year.partial());
        assertEquals(12, year.monthsCovered());

        double compounded = 1.0;
        for (CalendarReturnsReport.MonthlyReturn month : report.months()) {
            compounded *= 1.0 + month.returnPercent() / 100.0;
        }
        double compoundedPercent = (compounded - 1.0) * 100.0;
        assertEquals(year.returnPercent(), compoundedPercent, 1e-9);
    }

    @Test
    void inceptionMonthFallsBackToFirstNavOfMonth() {
        List<NavPoint> nav = List.of(
                point("2021-03-05", 100),
                point("2021-03-31", 110),
                point("2021-04-15", 115),
                point("2021-04-30", 121));

        CalendarReturnsReport report = calculator.compute(nav);

        assertEquals(2, report.months().size());
        CalendarReturnsReport.MonthlyReturn march = report.months().get(0);
        assertEquals(2021, march.year());
        assertEquals(3, march.month());
        assertEquals(100, march.startNav(), 1e-9);
        assertEquals(110, march.endNav(), 1e-9);
        assertEquals(10.0, march.returnPercent(), 1e-9);
        assertEquals("2021-03-05", march.startDate());
        assertEquals("2021-03-31", march.endDate());

        CalendarReturnsReport.MonthlyReturn april = report.months().get(1);
        assertEquals(110, april.startNav(), 1e-9);
        assertEquals(121, april.endNav(), 1e-9);
        assertEquals(10.0, april.returnPercent(), 1e-9);
    }

    @Test
    void shortSeriesProducesPartialYear() {
        List<NavPoint> nav = List.of(
                point("2023-01-02", 50),
                point("2023-01-31", 55),
                point("2023-02-28", 60),
                point("2023-03-31", 66));

        CalendarReturnsReport report = calculator.compute(nav);

        assertEquals(3, report.months().size());
        assertEquals(1, report.years().size());
        CalendarReturnsReport.YearlyReturn year = report.years().get(0);
        assertTrue(year.partial());
        assertEquals(3, year.monthsCovered());

        double compounded = 1.0;
        for (CalendarReturnsReport.MonthlyReturn month : report.months()) {
            compounded *= 1.0 + month.returnPercent() / 100.0;
        }
        assertEquals(year.returnPercent(), (compounded - 1.0) * 100.0, 1e-9);
        assertEquals(32.0, year.returnPercent(), 1e-9);
    }

    @Test
    void emptySeriesReturnsZeros() {
        CalendarReturnsReport report = calculator.compute(List.of());
        assertTrue(report.months().isEmpty());
        assertTrue(report.years().isEmpty());
        assertEquals(0, report.totalMonths());
        assertEquals(0, report.bestMonth(), 0);
        assertEquals(0, report.worstMonth(), 0);
    }

    @Test
    void chainedYearsUsePriorDecemberClose() {
        List<NavPoint> nav = new ArrayList<>();
        nav.addAll(fullYearNav(2019, 100));
        nav.addAll(fullYearNav(2020, 120));

        CalendarReturnsReport report = calculator.compute(nav);

        assertEquals(24, report.months().size());
        assertEquals(2, report.years().size());

        CalendarReturnsReport.YearlyReturn y2020 = report.years().get(1);
        assertEquals(2020, y2020.year());
        assertFalse(y2020.partial());

        List<CalendarReturnsReport.MonthlyReturn> months2020 = report.months().stream()
                .filter(m -> m.year() == 2020)
                .toList();
        double compounded = 1.0;
        for (CalendarReturnsReport.MonthlyReturn month : months2020) {
            compounded *= 1.0 + month.returnPercent() / 100.0;
        }
        assertEquals(y2020.returnPercent(), (compounded - 1.0) * 100.0, 1e-9);
    }

    private static List<NavPoint> fullYearNav(int year, double startNav) {
        List<NavPoint> points = new ArrayList<>();
        double nav = startNav;
        for (int month = 1; month <= 12; month++) {
            LocalDate mid = LocalDate.of(year, month, 15);
            LocalDate end = LocalDate.of(year, month, 1).plusMonths(1).minusDays(1);
            points.add(point(mid.toString(), nav));
            nav *= 1.01;
            points.add(point(end.toString(), nav));
        }
        return points;
    }

    private static NavPoint point(String isoDate, double nav) {
        Instant instant = LocalDate.parse(isoDate).atStartOfDay(ZoneOffset.UTC).toInstant();
        return new NavPoint(instant, nav);
    }
}
