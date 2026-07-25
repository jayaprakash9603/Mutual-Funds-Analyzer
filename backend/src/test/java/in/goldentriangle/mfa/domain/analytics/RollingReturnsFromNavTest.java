package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RollingReturnsFromNavTest {

    @Test
    void threeYearDoublingNavYieldsAboutTwentySixPercentCagr() {
        NavHistory history = historyWithDoublingEveryThreeYears();
        RollingReturnsData result = new RollingReturnsFromNav().compute(history);

        assertTrue(result.benchmark().isEmpty());
        assertFalse(result.fund().isEmpty());

        List<RollingReturnRow> threeYear = result.fund().stream()
                .filter(row -> Period.THREE_YEAR.label().equals(row.period()))
                .toList();
        assertFalse(threeYear.isEmpty());

        RollingReturnRow anchor = threeYear.stream()
                .filter(row -> "01-01-2010".equals(row.navDate()))
                .findFirst()
                .orElseThrow();

        assertEquals(100, anchor.schemeNav(), 0.001);
        assertEquals(200, anchor.schemeForwardNav(), 1.0);
        assertEquals(26.0, anchor.schemeRollingReturns(), 0.5);
    }

    private static NavHistory historyWithDoublingEveryThreeYears() {
        List<NavPoint> nav = new ArrayList<>();
        LocalDate cursor = LocalDate.of(2010, 1, 1);
        LocalDate end = LocalDate.of(2023, 1, 1);
        while (!cursor.isAfter(end)) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.of(2010, 1, 1), cursor);
            double years = days / 365.25;
            double value = 100 * Math.pow(2, years / 3.0);
            nav.add(new NavPoint(cursor.atStartOfDay(ZoneOffset.UTC).toInstant(), value));
            cursor = cursor.plusDays(1);
        }
        Instant first = nav.get(0).date();
        Instant last = nav.get(nav.size() - 1).date();
        return new NavHistory(
                "Test Fund",
                "Test Fund",
                "Benchmark",
                "Equity",
                "Test AMC",
                nav,
                List.of(),
                first,
                last,
                "01-01-2010");
    }
}
