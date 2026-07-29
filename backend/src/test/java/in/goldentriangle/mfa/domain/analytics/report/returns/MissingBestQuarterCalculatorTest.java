package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.MissingBestQuarterReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MissingBestQuarterCalculatorTest {

    private final MissingBestQuarterCalculator calculator = new MissingBestQuarterCalculator();

    @Test
    void missingBestQuarterReducesCagr() {
        List<NavPoint> nav = new ArrayList<>();
        Instant cursor = Instant.parse("2015-01-01T00:00:00Z");
        double value = 100;
        for (int month = 0; month < 60; month++) {
            if (month % 12 == 11) {
                value *= 1.25;
            } else if (month % 12 == 0) {
                value *= 1.02;
            } else {
                value *= 1.01;
            }
            nav.add(new NavPoint(cursor, value));
            cursor = cursor.atZone(java.time.ZoneOffset.UTC).plusMonths(1).toInstant();
        }

        MissingBestQuarterReport report = calculator.compute(nav);
        assertFalse(report.series().isEmpty());
        assertTrue(report.averageLostPercent() < 0, "Lost CAGR should be negative");
        assertTrue(report.latestLostPercent() < 0);
    }
}
