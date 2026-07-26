package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AllTimeHighsCalculatorTest {

    private final AllTimeHighsCalculator calculator = new AllTimeHighsCalculator();

    @Test
    void marksNewHighDaysAndYears() {
        List<NavPoint> nav = List.of(
                point("2010-01-01", 100),
                point("2010-06-01", 110),
                point("2010-12-01", 105),
                point("2011-03-01", 115),
                point("2011-09-01", 112));

        AllTimeHighsReport report = calculator.compute(nav);

        assertTrue(report.series().stream().anyMatch(AllTimeHighsReport.NavPoint::allTimeHigh));
        assertTrue(report.yearlyMaxLevels().stream().anyMatch(AllTimeHighsReport.YearlyMaxNav::allTimeHighYear));
        assertFalse(report.summary().headline().isBlank());
    }

    @Test
    void flatYearAfterPeakIsNotAllTimeHighYear() {
        List<NavPoint> nav = new ArrayList<>();
        Instant start = Instant.parse("2015-01-01T00:00:00Z");
        double value = 100;
        for (int i = 0; i < 252; i++) {
            if (i == 100) {
                value = 120;
            }
            nav.add(new NavPoint(start.plusSeconds((long) i * 86_400L), value));
        }
        for (int i = 0; i < 252; i++) {
            nav.add(new NavPoint(start.plusSeconds((long) (252 + i) * 86_400L), 110));
        }

        AllTimeHighsReport report = calculator.compute(nav);
        AllTimeHighsReport.YearlyMaxNav year2016 = report.yearlyMaxLevels().stream()
                .filter(y -> y.year() == 2016)
                .findFirst()
                .orElseThrow();

        assertFalse(year2016.allTimeHighYear());
    }

    private static NavPoint point(String isoDate, double nav) {
        return new NavPoint(Instant.parse(isoDate + "T00:00:00Z"), nav);
    }
}
