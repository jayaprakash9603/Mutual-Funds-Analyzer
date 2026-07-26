package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.DrawdownReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

public class DrawdownCalculator {

    /** Episodes listed in the API/UI — captures meaningful recoverable drawdowns. */
    private static final double EPISODE_LIST_THRESHOLD = 10;
    /** Keeps API payloads reasonable while preserving major troughs in the chart. */
    private static final int MAX_SERIES_POINTS = 800;

    public DrawdownReport compute(List<NavPoint> nav) {
        List<NavPoint> series = normalizeNav(nav);
        if (series.size() < 2) {
            return new DrawdownReport(0, 0, 0, 0, 0, List.of(), List.of());
        }

        List<DrawdownReport.DrawdownPoint> drawdownSeries = new ArrayList<>();
        double peak = series.get(0).nav();
        double maxDrawdown = 0;
        double currentDrawdown = 0;

        for (NavPoint point : series) {
            if (point.nav() > peak) {
                peak = point.nav();
            }
            double drawdown = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
            drawdownSeries.add(new DrawdownReport.DrawdownPoint(
                    NavDateParser.dateKey(point.date()), drawdown));
            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
            }
            currentDrawdown = drawdown;
        }

        List<DrawdownReport.DrawdownEpisode> episodes = detectEpisodes(series, EPISODE_LIST_THRESHOLD);
        double avgRecovery = episodes.stream()
                .filter(DrawdownReport.DrawdownEpisode::recovered)
                .mapToDouble(DrawdownReport.DrawdownEpisode::recoveryYears)
                .average()
                .orElse(0);

        double recoveryYears = episodes.stream()
                .max(Comparator.comparingDouble(e -> Math.abs(e.fallPercent())))
                .map(DrawdownReport.DrawdownEpisode::recoveryYears)
                .orElse(0.0);

        return new DrawdownReport(
                Math.abs(maxDrawdown),
                recoveryYears,
                Math.abs(maxDrawdown),
                avgRecovery,
                currentDrawdown,
                downsampleSeries(drawdownSeries, MAX_SERIES_POINTS),
                episodes);
    }

    static List<NavPoint> normalizeNav(List<NavPoint> nav) {
        Map<String, NavPoint> byDate = new HashMap<>();
        for (NavPoint point : nav) {
            byDate.put(NavDateParser.dateKey(point.date()), point);
        }
        return byDate.values().stream()
                .sorted(Comparator.comparing(NavPoint::date))
                .toList();
    }

    static List<DrawdownReport.DrawdownPoint> downsampleSeries(
            List<DrawdownReport.DrawdownPoint> series,
            int maxPoints) {
        if (series.size() <= maxPoints) {
            return series;
        }

        int minIdx = 0;
        for (int i = 1; i < series.size(); i++) {
            if (series.get(i).drawdownPercent() < series.get(minIdx).drawdownPercent()) {
                minIdx = i;
            }
        }

        TreeSet<Integer> indices = new TreeSet<>();
        indices.add(0);
        indices.add(series.size() - 1);
        indices.add(minIdx);

        int bucketCount = Math.max(1, maxPoints - indices.size());
        int bucketSize = (int) Math.ceil((double) series.size() / bucketCount);
        for (int start = 0; start < series.size(); start += bucketSize) {
            int end = Math.min(start + bucketSize, series.size());
            int bucketMin = start;
            for (int i = start + 1; i < end; i++) {
                if (series.get(i).drawdownPercent() < series.get(bucketMin).drawdownPercent()) {
                    bucketMin = i;
                }
            }
            indices.add(bucketMin);
            indices.add(end - 1);
        }

        List<DrawdownReport.DrawdownPoint> sampled = new ArrayList<>(indices.size());
        for (int index : indices) {
            sampled.add(series.get(index));
        }
        return List.copyOf(sampled);
    }

    public List<DrawdownReport.DrawdownEpisode> detectEpisodes(List<NavPoint> nav, double thresholdPercent) {
        List<NavPoint> series = normalizeNav(nav);
        if (series.isEmpty()) {
            return List.of();
        }

        List<DrawdownReport.DrawdownEpisode> episodes = new ArrayList<>();
        double peak = series.get(0).nav();
        Instant peakDate = series.get(0).date();
        boolean inCrash = false;
        Instant troughDate = peakDate;
        Instant peakAtCrashDate = peakDate;
        double troughNav = peak;
        double peakAtCrash = peak;
        NavPoint lastPoint = series.get(0);

        for (NavPoint point : series) {
            lastPoint = point;
            if (point.nav() >= peak) {
                if (inCrash) {
                    addEpisodeIfDeepEnough(
                            episodes,
                            thresholdPercent,
                            peakAtCrash,
                            peakAtCrashDate,
                            troughNav,
                            troughDate,
                            point.date(),
                            true);
                    inCrash = false;
                }
                peak = point.nav();
                peakDate = point.date();
            } else {
                double dd = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
                if (dd <= -thresholdPercent && !inCrash) {
                    inCrash = true;
                    peakAtCrash = peak;
                    peakAtCrashDate = peakDate;
                    troughNav = point.nav();
                    troughDate = point.date();
                } else if (inCrash && point.nav() < troughNav) {
                    troughNav = point.nav();
                    troughDate = point.date();
                }
            }
        }

        if (inCrash) {
            addEpisodeIfDeepEnough(
                    episodes,
                    thresholdPercent,
                    peakAtCrash,
                    peakAtCrashDate,
                    troughNav,
                    troughDate,
                    lastPoint.date(),
                    false);
        }

        episodes.sort((a, b) -> Double.compare(Math.abs(b.fallPercent()), Math.abs(a.fallPercent())));
        return episodes;
    }

    private static void addEpisodeIfDeepEnough(
            List<DrawdownReport.DrawdownEpisode> episodes,
            double thresholdPercent,
            double peakAtCrash,
            Instant peakAtCrashDate,
            double troughNav,
            Instant troughDate,
            Instant endDate,
            boolean recovered) {
        double fall = peakAtCrash <= 0 ? 0 : ((troughNav / peakAtCrash) - 1) * 100;
        if (Math.abs(fall) < thresholdPercent) {
            return;
        }
        double durationYears = CalendarMath.yearsBetweenMillis(troughDate.toEpochMilli(), endDate.toEpochMilli());
        episodes.add(new DrawdownReport.DrawdownEpisode(
                NavDateParser.dateKey(peakAtCrashDate),
                NavDateParser.dateKey(troughDate),
                recovered ? NavDateParser.dateKey(endDate) : "",
                fall,
                durationYears,
                recovered));
    }

    public ConsistencyReport calendarYears(List<NavPoint> nav) {
        List<NavPoint> series = normalizeNav(nav);
        Map<Integer, NavPoint> yearStart = new HashMap<>();
        Map<Integer, NavPoint> yearEnd = new HashMap<>();
        Map<Integer, Double> yearPeak = new HashMap<>();

        for (NavPoint point : series) {
            int year = point.date().atZone(ZoneOffset.UTC).getYear();
            yearStart.putIfAbsent(year, point);
            yearEnd.put(year, point);
            yearPeak.merge(year, point.nav(), Math::max);
        }

        List<ConsistencyReport.CalendarYearReturn> calendarYears = new ArrayList<>();
        double worstYear = Double.MAX_VALUE;
        double bestYear = Double.MIN_VALUE;

        for (int year : yearStart.keySet().stream().sorted().toList()) {
            NavPoint start = yearStart.get(year);
            NavPoint end = yearEnd.get(year);
            double cyReturn = CalendarMath.absoluteReturn(start.nav(), end.nav());

            double peak = yearPeak.getOrDefault(year, end.nav());
            double maxDd = 0;
            for (NavPoint point : series) {
                int y = point.date().atZone(ZoneOffset.UTC).getYear();
                if (y != year) {
                    continue;
                }
                double dd = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
                maxDd = Math.min(maxDd, dd);
            }

            calendarYears.add(new ConsistencyReport.CalendarYearReturn(year, cyReturn, maxDd));
            worstYear = Math.min(worstYear, cyReturn);
            bestYear = Math.max(bestYear, cyReturn);
        }

        List<ConsistencyReport.HeatmapCell> heatmap = monthlyHeatmap(series);
        double worstMonth = heatmap.stream().mapToDouble(ConsistencyReport.HeatmapCell::returnPercent).min().orElse(0);
        double bestMonth = heatmap.stream().mapToDouble(ConsistencyReport.HeatmapCell::returnPercent).max().orElse(0);

        int winStreak = longestStreak(calendarYears, true);
        int loseStreak = longestStreak(calendarYears, false);

        long positiveYears = calendarYears.stream().filter(y -> y.returnPercent() > 0).count();
        String rating = positiveYears >= calendarYears.size() * 0.75 ? "Excellent"
                : positiveYears >= calendarYears.size() * 0.5 ? "Good" : "Average";

        return new ConsistencyReport(
                calendarYears,
                heatmap,
                worstYear == Double.MAX_VALUE ? 0 : worstYear,
                bestYear == Double.MIN_VALUE ? 0 : bestYear,
                worstMonth,
                bestMonth,
                winStreak,
                loseStreak,
                rating);
    }

    private List<ConsistencyReport.HeatmapCell> monthlyHeatmap(List<NavPoint> nav) {
        Map<String, NavPoint> monthStart = new HashMap<>();
        Map<String, NavPoint> monthEnd = new HashMap<>();

        for (NavPoint point : nav) {
            var zdt = point.date().atZone(ZoneOffset.UTC);
            String key = zdt.getYear() + "-" + zdt.getMonthValue();
            monthStart.putIfAbsent(key, point);
            monthEnd.put(key, point);
        }

        List<ConsistencyReport.HeatmapCell> cells = new ArrayList<>();
        for (String key : monthStart.keySet().stream().sorted().toList()) {
            String[] parts = key.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            double ret = CalendarMath.absoluteReturn(monthStart.get(key).nav(), monthEnd.get(key).nav());
            cells.add(new ConsistencyReport.HeatmapCell(year, month, ret));
        }
        return cells;
    }

    private int longestStreak(List<ConsistencyReport.CalendarYearReturn> years, boolean positive) {
        int max = 0;
        int current = 0;
        for (ConsistencyReport.CalendarYearReturn year : years) {
            boolean match = positive ? year.returnPercent() > 0 : year.returnPercent() <= 0;
            if (match) {
                current++;
                max = Math.max(max, current);
            } else {
                current = 0;
            }
        }
        return max;
    }
}
