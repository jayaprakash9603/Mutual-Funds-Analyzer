package in.goldentriangle.mfa.domain.analytics.report.risk;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport.RollingSharpePoint;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RollingSharpeCalculatorTest {

    private final RollingSharpeCalculator calculator = new RollingSharpeCalculator(0.06);

    @Test
    void producesSeriesWhenHistoryExceedsWindow() {
        List<NavPoint> nav = buildDailyNav(400, 0.0008);
        List<RollingSharpePoint> series = calculator.compute(nav, List.of());
        assertFalse(series.isEmpty());
        assertTrue(series.stream().allMatch(point -> Double.isFinite(point.fundSharpe())));
    }

    @Test
    void emptyWhenHistoryTooShort() {
        List<NavPoint> nav = buildDailyNav(100, 0.0008);
        assertTrue(calculator.compute(nav, List.of()).isEmpty());
    }

    private static List<NavPoint> buildDailyNav(int days, double dailyGrowth) {
        List<NavPoint> nav = new ArrayList<>();
        Instant cursor = Instant.parse("2018-01-01T00:00:00Z");
        double value = 100;
        for (int i = 0; i < days; i++) {
            nav.add(new NavPoint(cursor, value));
            value *= (1 + dailyGrowth);
            cursor = cursor.atZone(ZoneOffset.UTC).plusDays(1).toInstant();
        }
        return nav;
    }
}
