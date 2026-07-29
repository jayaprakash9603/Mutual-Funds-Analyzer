package in.goldentriangle.mfa.domain.analytics.report.matrix;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.matrix.MultiplyOddsReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MultiplyOddsCalculatorTest {

    private final MultiplyOddsCalculator calculator = new MultiplyOddsCalculator();

    @Test
    void geometricSeriesDoublesEveryFiveYears() {
        List<NavPoint> nav = new ArrayList<>();
        Instant start = Instant.parse("2010-01-01T00:00:00Z");
        double navValue = 100;
        for (int day = 0; day < 365 * 12; day += 7) {
            double years = day / 365.25;
            navValue = 100 * Math.pow(2, years / 5.0);
            nav.add(new NavPoint(start.plusSeconds(day * 86400L), navValue));
        }

        MultiplyOddsReport report = calculator.compute(nav);
        MultiplyOddsReport.MultiplyRow doubleRow = report.rows().stream()
                .filter(r -> r.multiply() == 2)
                .findFirst()
                .orElseThrow();
        MultiplyOddsReport.OddsCell fiveYear = doubleRow.cells().stream()
                .filter(c -> c.holdingYears() == 5)
                .findFirst()
                .orElseThrow();

        assertNotNull(fiveYear.percent());
        assertTrue(fiveYear.percent() >= 95, "Expected ~100% odds of doubling in 5Y, got " + fiveYear.percent());

        MultiplyOddsReport.OddsCell tripleFiveYear = report.rows().stream()
                .filter(r -> r.multiply() == 3)
                .findFirst()
                .orElseThrow()
                .cells().stream()
                .filter(c -> c.holdingYears() == 5)
                .findFirst()
                .orElseThrow();
        assertEquals(0, tripleFiveYear.hitCount());
    }
}
