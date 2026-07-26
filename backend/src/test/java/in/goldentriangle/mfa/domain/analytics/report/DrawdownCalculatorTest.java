package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.DrawdownReport;
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

    private static NavPoint nav(String date, double value) {
        return new NavPoint(Instant.parse(date + "T00:00:00Z"), value);
    }
}
