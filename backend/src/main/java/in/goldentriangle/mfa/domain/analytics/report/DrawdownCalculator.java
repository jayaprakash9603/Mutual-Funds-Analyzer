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

public class DrawdownCalculator {

    private static final double CRASH_THRESHOLD = 30;
    /** Keeps API payloads small; the UI charts a downsampled series anyway. */
    private static final int MAX_SERIES_POINTS = 400;

    public DrawdownReport compute(List<NavPoint> nav) {
        if (nav.size() < 2) {
            return new DrawdownReport(0, 0, 0, 0, List.of(), List.of());
        }
        List<DrawdownReport.DrawdownPoint> series = new ArrayList<>();
        double peak = nav.get(0).nav();
        Instant peakDate = nav.get(0).date();
        double maxDrawdown = 0;
        Instant troughDate = nav.get(0).date();
        Instant maxTroughDate = troughDate;

        for (NavPoint point : nav) {
            if (point.nav() > peak) {
                peak = point.nav();
                peakDate = point.date();
            }
            double drawdown = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
            series.add(new DrawdownReport.DrawdownPoint(
                    NavDateParser.dateKey(point.date()), drawdown));
            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
                maxTroughDate = point.date();
                troughDate = point.date();
            }
        }

        List<DrawdownReport.DrawdownEpisode> episodes = detectEpisodes(nav, CRASH_THRESHOLD);
        double avgRecovery = episodes.stream()
                .mapToDouble(DrawdownReport.DrawdownEpisode::recoveryYears)
                .average()
                .orElse(0);

        double recoveryYears = episodes.isEmpty() ? 0 : episodes.get(0).recoveryYears();

        return new DrawdownReport(
                Math.abs(maxDrawdown),
                recoveryYears,
                Math.abs(maxDrawdown),
                avgRecovery,
                downsampleSeries(series, MAX_SERIES_POINTS),
                episodes);
    }

    static List<DrawdownReport.DrawdownPoint> downsampleSeries(
            List<DrawdownReport.DrawdownPoint> series,
            int maxPoints) {
        if (series.size() <= maxPoints) {
            return series;
        }
        int step = (int) Math.ceil((double) series.size() / maxPoints);
        List<DrawdownReport.DrawdownPoint> sampled = new ArrayList<>();
        for (int i = 0; i < series.size(); i += step) {
            sampled.add(series.get(i));
        }
        DrawdownReport.DrawdownPoint last = series.get(series.size() - 1);
        if (!sampled.get(sampled.size() - 1).date().equals(last.date())) {
            sampled.add(last);
        }
        return List.copyOf(sampled);
    }

    public List<DrawdownReport.DrawdownEpisode> detectEpisodes(List<NavPoint> nav, double thresholdPercent) {
        List<DrawdownReport.DrawdownEpisode> episodes = new ArrayList<>();
        double peak = nav.get(0).nav();
        Instant peakDate = nav.get(0).date();
        boolean inCrash = false;
        Instant troughDate = peakDate;
        double troughNav = peak;
        double peakAtCrash = peak;

        for (NavPoint point : nav) {
            if (point.nav() >= peak) {
                if (inCrash) {
                    double fall = peakAtCrash <= 0 ? 0 : ((troughNav / peakAtCrash) - 1) * 100;
                    if (Math.abs(fall) >= thresholdPercent) {
                        double recoveryYears = CalendarMath.yearsBetweenMillis(
                                troughDate.toEpochMilli(), point.date().toEpochMilli());
                        episodes.add(new DrawdownReport.DrawdownEpisode(
                                NavDateParser.dateKey(peakDate),
                                NavDateParser.dateKey(troughDate),
                                NavDateParser.dateKey(point.date()),
                                fall,
                                recoveryYears));
                    }
                    inCrash = false;
                }
                peak = point.nav();
                peakDate = point.date();
            } else {
                double dd = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
                if (dd <= -thresholdPercent && !inCrash) {
                    inCrash = true;
                    peakAtCrash = peak;
                    troughNav = point.nav();
                    troughDate = point.date();
                } else if (inCrash && point.nav() < troughNav) {
                    troughNav = point.nav();
                    troughDate = point.date();
                }
            }
        }
        return episodes;
    }

    public ConsistencyReport calendarYears(List<NavPoint> nav) {
        Map<Integer, NavPoint> yearStart = new HashMap<>();
        Map<Integer, NavPoint> yearEnd = new HashMap<>();
        Map<Integer, Double> yearPeak = new HashMap<>();

        for (NavPoint point : nav) {
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
            for (NavPoint point : nav) {
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

        List<ConsistencyReport.HeatmapCell> heatmap = monthlyHeatmap(nav);
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
