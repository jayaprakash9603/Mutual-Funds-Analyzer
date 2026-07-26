package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    @Test
    void athThatNeverFallsTenPercentBelowIsMarkedAsNeverFell() {
        List<NavPoint> nav = List.of(
                point("2020-01-01", 100),
                point("2020-06-01", 110),
                point("2020-12-01", 115),
                point("2021-06-01", 120),
                point("2022-01-01", 125));

        AllTimeHighsReport report = calculator.compute(nav, "Test Fund");

        AllTimeHighsReport.NavPoint firstAth = report.series().stream()
                .filter(AllTimeHighsReport.NavPoint::allTimeHigh)
                .findFirst()
                .orElseThrow();
        assertEquals(Boolean.FALSE, firstAth.fellBelowThreshold());
        assertTrue(report.athDeclineOutlook().neverFellPercent() > 0);
    }

    @Test
    void athFollowedByDeepDrawdownIsMarkedAsFell() {
        List<NavPoint> nav = List.of(
                point("2020-01-01", 100),
                point("2020-06-01", 120),
                point("2020-12-01", 90),
                point("2021-06-01", 95));

        AllTimeHighsReport report = calculator.compute(nav, "Test Fund");

        AllTimeHighsReport.NavPoint athAt120 = report.series().stream()
                .filter(p -> p.allTimeHigh() && p.nav() == 120)
                .findFirst()
                .orElseThrow();
        assertEquals(Boolean.TRUE, athAt120.fellBelowThreshold());
        assertTrue(report.athDeclineOutlook().fellCount() > 0);
    }

    @Test
    void postAthHorizonWithInsufficientHistoryReportsZeroSamples() {
        List<NavPoint> nav = List.of(
                point("2024-01-01", 100),
                point("2024-06-01", 110),
                point("2025-01-01", 115));

        AllTimeHighsReport report = calculator.compute(nav, "Young Fund");
        AllTimeHighsReport.PostAthHorizon fiveYear = report.postAthReturns().horizons().stream()
                .filter(h -> h.years() == 5)
                .findFirst()
                .orElseThrow();

        assertEquals(0, fiveYear.sampleCount());
    }

    @Test
    void postAthThresholdSharesSumMeaningfullyForOneYearHorizon() {
        List<NavPoint> nav = new ArrayList<>();
        Instant start = Instant.parse("2010-01-01T00:00:00Z");
        double navValue = 100;
        for (int i = 0; i < 365 * 8; i++) {
            if (i % 400 == 0) {
                navValue += 5;
            }
            nav.add(new NavPoint(start.plus(i, java.time.temporal.ChronoUnit.DAYS), navValue));
        }

        AllTimeHighsReport report = calculator.compute(nav, "Steady Fund");
        AllTimeHighsReport.PostAthHorizon oneYear = report.postAthReturns().horizons().stream()
                .filter(h -> h.years() == 1)
                .findFirst()
                .orElseThrow();

        assertTrue(oneYear.sampleCount() > 0);
        assertTrue(oneYear.thresholds().stream().anyMatch(t -> t.label().contains(">0%")));
    }

    private static NavPoint point(String isoDate, double nav) {
        return new NavPoint(Instant.parse(isoDate + "T00:00:00Z"), nav);
    }
}
