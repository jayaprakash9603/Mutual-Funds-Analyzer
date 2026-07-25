package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MatrixCalculatorTest {

    @Test
    void fillsYearStartCellsWhenNavIsWeekly() {
        List<NavPoint> nav = weeklyNav(LocalDate.of(2014, 1, 7), LocalDate.of(2020, 6, 1), 10.0);
        NavHistory history = new NavHistory(
                "Test Fund",
                "Test Fund",
                "Index",
                "Equity",
                "AMC",
                nav,
                List.of(),
                nav.get(0).date(),
                nav.get(nav.size() - 1).date(),
                "01-01-2013");

        MatrixReport report = new MatrixCalculator().compute(history, MatrixMode.MULTIPLE);

        long populated = report.dataRows().stream()
                .flatMap(r -> r.cells().stream())
                .filter(c -> c.value() != null)
                .count();
        assertTrue(populated > 0, "expected populated multiplier cells, got 0");
        assertNotNull(report.summaryRows().get(0).values().get(0));
    }

    private static List<NavPoint> weeklyNav(LocalDate from, LocalDate to, double startNav) {
        List<NavPoint> points = new ArrayList<>();
        double nav = startNav;
        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            points.add(new NavPoint(cursor.atStartOfDay(ZoneOffset.UTC).toInstant(), nav));
            nav *= 1.002;
            cursor = cursor.plusDays(7);
        }
        return points;
    }
}
