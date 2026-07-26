package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.BestDaysReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BestDaysCalculatorTest {

    private final BestDaysCalculator calculator = new BestDaysCalculator();

    @Test
    void missingBestDaysReducesFinalValue() {
        List<NavPoint> nav = syntheticNavWithSpikes();
        BestDaysReport report = calculator.compute(nav);

        assertFalse(report.missingScenarios().isEmpty());
        BestDaysReport.MissingBestDaysScenario baseline = report.missingScenarios().get(0);
        BestDaysReport.MissingBestDaysScenario miss10 = report.missingScenarios().stream()
                .filter(s -> s.missCount() == 10)
                .findFirst()
                .orElseThrow();

        assertEquals(0, baseline.missCount());
        assertTrue(baseline.finalValue() > miss10.finalValue());
        assertTrue(miss10.lowerByPercent() > 0);
    }

    @Test
    void ranksTopDaysAndBuildsCumulativeReturns() {
        List<NavPoint> nav = syntheticNavWithSpikes();
        BestDaysReport report = calculator.compute(nav);

        assertFalse(report.topBestDays().isEmpty());
        assertEquals(1, report.topBestDays().get(0).rank());
        assertFalse(report.topDaysCumulative().isEmpty());
        assertTrue(report.topDaysCumulative().get(0).cumulativeReturnPercent() > 0);
    }

    private static List<NavPoint> syntheticNavWithSpikes() {
        List<NavPoint> points = new ArrayList<>();
        Instant start = Instant.parse("2010-01-01T00:00:00Z");
        double nav = 100;
        for (int i = 0; i < 400; i++) {
            if (i == 50) {
                nav *= 1.12;
            } else if (i == 120) {
                nav *= 1.09;
            } else if (i == 200) {
                nav *= 0.92;
            } else if (i == 201) {
                nav *= 1.08;
            } else {
                nav *= 1 + (Math.sin(i / 17.0) * 0.004);
            }
            points.add(new NavPoint(start.plusSeconds((long) i * 86_400L), nav));
        }
        return points;
    }
}
