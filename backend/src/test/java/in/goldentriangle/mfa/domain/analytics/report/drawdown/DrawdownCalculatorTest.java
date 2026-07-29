package in.goldentriangle.mfa.domain.analytics.report.drawdown;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DrawdownCalculatorTest {

    private final DrawdownCalculator calculator = new DrawdownCalculator();

    @Test
    void computeCapturesMajorCrashAndCurrentDrawdown() {
        List<NavPoint> nav = List.of(
                nav("2020-01-01", 100),
                nav("2020-02-01", 110),
                nav("2020-03-01", 77),
                nav("2020-07-01", 112),
                nav("2020-12-01", 105));

        DrawdownReport report = calculator.compute(nav);

        assertEquals(30, report.biggestCrash(), 0.1);
        assertTrue(report.currentDrawdown() < 0);
        assertTrue(report.series().stream().anyMatch(p -> p.drawdownPercent() <= -29));
    }

    @Test
    void downsamplePreservesGlobalMinimum() {
        List<DrawdownReport.DrawdownPoint> series = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            double drawdown = i == 500 ? -40 : 0;
            series.add(new DrawdownReport.DrawdownPoint("2020-01-" + String.format("%02d", (i % 28) + 1), drawdown));
        }

        List<DrawdownReport.DrawdownPoint> sampled = DrawdownCalculator.downsampleSeries(series, 100);

        assertTrue(sampled.stream().anyMatch(p -> p.drawdownPercent() <= -40));
    }

    @Test
    void detectEpisodesIncludesOpenDrawdownAtSeriesEnd() {
        List<NavPoint> nav = List.of(
                nav("2021-01-01", 100),
                nav("2021-02-01", 120),
                nav("2021-03-01", 84),
                nav("2021-04-01", 90));

        List<DrawdownReport.DrawdownEpisode> episodes = calculator.detectEpisodes(nav, 10);

        assertEquals(1, episodes.size());
        DrawdownReport.DrawdownEpisode episode = episodes.get(0);
        assertEquals(-30, episode.fallPercent(), 0.1);
        assertFalse(episode.recovered());
        assertEquals("", episode.recoveryDate());
    }

    @Test
    void detectEpisodesUsesPeakBeforeCrash() {
        List<NavPoint> nav = List.of(
                nav("2021-01-01", 100),
                nav("2021-02-01", 120),
                nav("2021-03-01", 84),
                nav("2021-07-01", 121));

        List<DrawdownReport.DrawdownEpisode> episodes = calculator.detectEpisodes(nav, 10);

        assertEquals(1, episodes.size());
        assertEquals("2021-02-01", episodes.get(0).peakDate());
        assertTrue(episodes.get(0).recovered());
    }

    @Test
    void thresholdRecoveriesRecordCrossingAndRecovery() {
        List<NavPoint> nav = List.of(
                nav("2020-01-01", 100),
                nav("2020-02-01", 110),
                nav("2020-03-01", 70),
                nav("2020-08-01", 112));

        DrawdownReport report = calculator.compute(nav);
        List<DrawdownReport.ThresholdRecovery> at30 = report.thresholdRecoveries().stream()
                .filter(r -> r.thresholdPercent() == -30)
                .toList();

        assertEquals(1, at30.size());
        DrawdownReport.ThresholdRecovery event = at30.get(0);
        assertEquals("2020-03-01", event.crossDate());
        assertTrue(event.recovered());
        assertEquals("2020-08-01", event.recoveryDate());
        assertFalse(event.usesCagr());
    }

    @Test
    void bearMarketDecadesOmitDecadesWithoutNavData() {
        List<NavPoint> nav = new ArrayList<>();
        for (int year = 2013; year <= 2024; year++) {
            nav.add(nav(year + "-06-01", 100 + (year - 2013)));
        }

        DrawdownReport report = calculator.compute(nav);

        assertFalse(report.bearMarketDecades().isEmpty());
        assertTrue(report.bearMarketDecades().stream().noneMatch(d -> d.decadeLabel().startsWith("200")));
        assertTrue(report.bearMarketDecades().stream().allMatch(d -> d.totalDays() > 0));
    }

    private static NavPoint nav(String date, double value) {
        return new NavPoint(Instant.parse(date + "T00:00:00Z"), value);
    }
}
