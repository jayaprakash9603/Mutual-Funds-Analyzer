package in.goldentriangle.mfa.domain.analytics.report.drawdown;

import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.analytics.NavSeriesOrder;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownReport;

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
    /** Timeline phases use a lower bar so major cycles are visible. */
    private static final double PHASE_THRESHOLD = 5;
    /** Bear market = more than 20% below running peak. */
    private static final double BEAR_MARKET_THRESHOLD = -20;
    private static final double MIN_HISTORY_YEARS = 10;
    /** Keeps API payloads reasonable while preserving major troughs in the chart. */
    private static final int MAX_SERIES_POINTS = 800;
    private static final double[] THRESHOLD_PERCENTS = {0, -5, -10, -20, -30, -40, -50};
    private static final double[] RECOVERY_THRESHOLDS = {-30, -40, -50};

    public DrawdownReport compute(List<NavPoint> fundNav) {
        return compute(fundNav, List.of());
    }

    public DrawdownReport compute(List<NavPoint> fundNav, List<NavPoint> benchmarkNav) {
        List<NavPoint> series = normalizeNav(fundNav);
        if (series.size() < 2) {
            return emptyReport();
        }

        List<DrawdownReport.DrawdownPoint> drawdownSeries = new ArrayList<>();
        List<DrawdownReport.NavIndexPoint> indexedSeries = new ArrayList<>();
        Map<Integer, int[]> decadeCounts = new HashMap<>();
        int[] fundThresholdCounts = new int[THRESHOLD_PERCENTS.length];

        double peak = series.get(0).nav();
        double startNav = series.get(0).nav();
        double maxDrawdown = 0;
        double currentDrawdown = 0;
        Instant firstDate = series.get(0).date();
        Instant lastDate = series.get(series.size() - 1).date();
        double historyYears = CalendarMath.yearsBetweenMillis(
                firstDate.toEpochMilli(), lastDate.toEpochMilli());

        for (NavPoint point : series) {
            if (point.nav() > peak) {
                peak = point.nav();
            }
            double drawdown = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
            drawdownSeries.add(new DrawdownReport.DrawdownPoint(
                    NavDateParser.dateKey(point.date()), drawdown));
            indexedSeries.add(new DrawdownReport.NavIndexPoint(
                    NavDateParser.dateKey(point.date()),
                    startNav <= 0 ? 100 : (point.nav() / startNav) * 100,
                    point.nav()));

            for (int i = 0; i < THRESHOLD_PERCENTS.length; i++) {
                if (isBelowThreshold(drawdown, THRESHOLD_PERCENTS[i])) {
                    fundThresholdCounts[i]++;
                }
            }

            if (historyYears >= MIN_HISTORY_YEARS) {
                int decade = (point.date().atZone(ZoneOffset.UTC).getYear() / 10) * 10;
                int[] counts = decadeCounts.computeIfAbsent(decade, ignored -> new int[2]);
                counts[1]++;
                if (drawdown <= BEAR_MARKET_THRESHOLD) {
                    counts[0]++;
                }
            }

            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
            }
            currentDrawdown = drawdown;
        }

        int totalDays = series.size();
        List<DrawdownReport.DrawdownThresholdRow> thresholdRows = buildThresholdRows(
                fundThresholdCounts, totalDays, benchmarkNav);

        List<DrawdownReport.BearMarketDecade> bearMarketDecades = historyYears >= MIN_HISTORY_YEARS
                ? buildBearMarketDecades(decadeCounts, firstDate, lastDate)
                : List.of();

        List<DrawdownReport.DrawdownEpisode> phaseEpisodes = detectEpisodes(series, PHASE_THRESHOLD);
        List<DrawdownReport.DrawdownEpisode> episodes = phaseEpisodes.stream()
                .filter(episode -> Math.abs(episode.fallPercent()) >= EPISODE_LIST_THRESHOLD)
                .toList();
        List<DrawdownReport.DrawdownPhase> phases = buildPhases(series, phaseEpisodes);

        double avgRecovery = episodes.stream()
                .filter(DrawdownReport.DrawdownEpisode::recovered)
                .mapToDouble(DrawdownReport.DrawdownEpisode::recoveryYears)
                .average()
                .orElse(0);

        double recoveryYears = episodes.stream()
                .max(Comparator.comparingDouble(e -> Math.abs(e.fallPercent())))
                .map(DrawdownReport.DrawdownEpisode::recoveryYears)
                .orElse(0.0);

        List<DrawdownReport.ThresholdRecovery> thresholdRecoveries = buildThresholdRecoveries(series);

        return new DrawdownReport(
                Math.abs(maxDrawdown),
                recoveryYears,
                Math.abs(maxDrawdown),
                avgRecovery,
                currentDrawdown,
                downsampleSeries(drawdownSeries, MAX_SERIES_POINTS),
                episodes,
                bearMarketDecades,
                thresholdRows,
                phases,
                List.copyOf(indexedSeries),
                thresholdRecoveries);
    }

    private static DrawdownReport emptyReport() {
        return new DrawdownReport(
                0, 0, 0, 0, 0,
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
    }

    private static boolean isBelowThreshold(double drawdown, double thresholdPercent) {
        if (thresholdPercent == 0) {
            return drawdown < 0;
        }
        return drawdown <= thresholdPercent;
    }

    private List<DrawdownReport.DrawdownThresholdRow> buildThresholdRows(
            int[] fundCounts,
            int totalDays,
            List<NavPoint> benchmarkNav) {
        List<NavPoint> normalizedBenchmark = normalizeNav(benchmarkNav);
        int[] benchmarkCounts = countThresholds(normalizedBenchmark);
        int benchmarkTotal = Math.max(1, normalizedBenchmark.size());

        List<DrawdownReport.DrawdownThresholdRow> rows = new ArrayList<>();
        for (int i = 0; i < THRESHOLD_PERCENTS.length; i++) {
            rows.add(new DrawdownReport.DrawdownThresholdRow(
                    THRESHOLD_PERCENTS[i],
                    totalDays == 0 ? 0 : (fundCounts[i] * 100.0) / totalDays,
                    fundCounts[i],
                    benchmarkTotal == 0 ? 0 : (benchmarkCounts[i] * 100.0) / benchmarkTotal));
        }
        return rows;
    }

    private int[] countThresholds(List<NavPoint> series) {
        int[] counts = new int[THRESHOLD_PERCENTS.length];
        if (series.isEmpty()) {
            return counts;
        }
        double peak = series.get(0).nav();
        for (NavPoint point : series) {
            if (point.nav() > peak) {
                peak = point.nav();
            }
            double drawdown = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
            for (int i = 0; i < THRESHOLD_PERCENTS.length; i++) {
                if (isBelowThreshold(drawdown, THRESHOLD_PERCENTS[i])) {
                    counts[i]++;
                }
            }
        }
        return counts;
    }

    /** Exposed for peer drawdown aggregation. */
    public double[] thresholdPercents() {
        return THRESHOLD_PERCENTS.clone();
    }

    /** Exposed for peer drawdown aggregation. */
    public int[] countThresholdsForSeries(List<NavPoint> nav) {
        return countThresholds(normalizeNav(nav));
    }

    /** Exposed for peer drawdown aggregation. */
    public double[] thresholdPercentOfDaysForSeries(List<NavPoint> nav) {
        List<NavPoint> series = normalizeNav(nav);
        int[] counts = countThresholds(series);
        int total = Math.max(1, series.size());
        double[] percents = new double[counts.length];
        for (int i = 0; i < counts.length; i++) {
            percents[i] = (counts[i] * 100.0) / total;
        }
        return percents;
    }

    private List<DrawdownReport.BearMarketDecade> buildBearMarketDecades(
            Map<Integer, int[]> decadeCounts,
            Instant firstDate,
            Instant lastDate) {
        int firstDecade = (firstDate.atZone(ZoneOffset.UTC).getYear() / 10) * 10;
        int lastDecade = (lastDate.atZone(ZoneOffset.UTC).getYear() / 10) * 10;

        List<DrawdownReport.BearMarketDecade> decades = new ArrayList<>();
        for (int decade : decadeCounts.keySet().stream().sorted().toList()) {
            int[] counts = decadeCounts.get(decade);
            if (counts == null || counts[1] == 0) {
                continue;
            }
            int bearDays = counts[0];
            int totalDays = counts[1];
            boolean partial = decade == firstDecade || decade == lastDecade;
            decades.add(new DrawdownReport.BearMarketDecade(
                    decade + "s",
                    (bearDays * 100.0) / totalDays,
                    bearDays,
                    totalDays,
                    partial));
        }
        return decades;
    }

    private List<DrawdownReport.DrawdownPhase> buildPhases(
            List<NavPoint> series,
            List<DrawdownReport.DrawdownEpisode> episodes) {
        Map<String, NavPoint> navByDate = new HashMap<>();
        for (NavPoint point : series) {
            navByDate.put(NavDateParser.dateKey(point.date()), point);
        }

        List<DrawdownReport.DrawdownEpisode> chronological = episodes.stream()
                .sorted(Comparator.comparing(DrawdownReport.DrawdownEpisode::peakDate))
                .toList();

        List<DrawdownReport.DrawdownPhase> phases = new ArrayList<>();
        for (DrawdownReport.DrawdownEpisode episode : chronological) {
            NavPoint peak = navByDate.get(episode.peakDate());
            NavPoint trough = navByDate.get(episode.troughDate());
            if (peak == null || trough == null) {
                continue;
            }

            double declineYears = CalendarMath.yearsBetweenMillis(
                    peak.date().toEpochMilli(), trough.date().toEpochMilli());
            phases.add(new DrawdownReport.DrawdownPhase(
                    "DECLINE",
                    episode.peakDate(),
                    episode.troughDate(),
                    episode.fallPercent(),
                    formatDurationLabel(declineYears),
                    declineYears,
                    false));

            if (episode.recovered() && !episode.recoveryDate().isBlank()) {
                NavPoint recovery = navByDate.get(episode.recoveryDate());
                if (recovery != null && trough.nav() > 0) {
                    double recoveryPercent = CalendarMath.absoluteReturn(trough.nav(), recovery.nav());
                    double recoveryYears = CalendarMath.yearsBetweenMillis(
                            trough.date().toEpochMilli(), recovery.date().toEpochMilli());
                    phases.add(new DrawdownReport.DrawdownPhase(
                            "RECOVERY",
                            episode.troughDate(),
                            episode.recoveryDate(),
                            recoveryPercent,
                            formatDurationLabel(recoveryYears),
                            recoveryYears,
                            false));
                }
            } else {
                NavPoint last = series.get(series.size() - 1);
                double recoveryPercent = trough.nav() > 0
                        ? CalendarMath.absoluteReturn(trough.nav(), last.nav())
                        : 0;
                phases.add(new DrawdownReport.DrawdownPhase(
                        "RECOVERY",
                        episode.troughDate(),
                        NavDateParser.dateKey(last.date()),
                        recoveryPercent,
                        formatDurationLabel(episode.recoveryYears()),
                        episode.recoveryYears(),
                        true));
            }
        }
        return phases;
    }

    List<DrawdownReport.ThresholdRecovery> buildThresholdRecoveries(List<NavPoint> series) {
        List<DrawdownReport.ThresholdRecovery> all = new ArrayList<>();
        for (double threshold : RECOVERY_THRESHOLDS) {
            all.addAll(buildThresholdRecoveriesForLevel(series, threshold));
        }
        return List.copyOf(all);
    }

    private List<DrawdownReport.ThresholdRecovery> buildThresholdRecoveriesForLevel(
            List<NavPoint> series,
            double thresholdPercent) {
        List<DrawdownReport.ThresholdRecovery> events = new ArrayList<>();
        if (series.isEmpty()) {
            return events;
        }

        double peakNav = series.get(0).nav();
        boolean trackingRecovery = false;
        double cyclePeakNav = peakNav;
        Instant crossInstant = null;
        double crossNav = 0;
        int sequence = 0;

        for (int i = 0; i < series.size(); i++) {
            NavPoint point = series.get(i);

            if (trackingRecovery) {
                if (point.nav() >= cyclePeakNav) {
                    sequence++;
                    events.add(buildThresholdRecoveryEvent(
                            thresholdPercent,
                            sequence,
                            crossInstant,
                            crossNav,
                            point.date(),
                            point.nav(),
                            true));
                    trackingRecovery = false;
                    peakNav = point.nav();
                }
                continue;
            }

            if (point.nav() > peakNav) {
                peakNav = point.nav();
            }

            double drawdown = peakNav <= 0 ? 0 : ((point.nav() / peakNav) - 1) * 100;

            if (drawdown <= thresholdPercent) {
                trackingRecovery = true;
                cyclePeakNav = peakNav;
                crossInstant = point.date();
                crossNav = point.nav();
            }
        }

        if (trackingRecovery && crossInstant != null) {
            NavPoint last = series.get(series.size() - 1);
            sequence++;
            events.add(buildThresholdRecoveryEvent(
                    thresholdPercent,
                    sequence,
                    crossInstant,
                    crossNav,
                    last.date(),
                    last.nav(),
                    false));
        }

        return events;
    }

    private DrawdownReport.ThresholdRecovery buildThresholdRecoveryEvent(
            double thresholdPercent,
            int sequence,
            Instant crossInstant,
            double crossNav,
            Instant endInstant,
            double endNav,
            boolean recovered) {
        double recoveryYears = CalendarMath.yearsBetweenMillis(
                crossInstant.toEpochMilli(), endInstant.toEpochMilli());
        boolean usesCagr = recoveryYears >= 1.0;
        double returnPercent = usesCagr
                ? CalendarMath.cagr(crossNav, endNav, recoveryYears)
                : CalendarMath.absoluteReturn(crossNav, endNav);
        return new DrawdownReport.ThresholdRecovery(
                thresholdPercent,
                sequence,
                NavDateParser.dateKey(crossInstant),
                recovered ? NavDateParser.dateKey(endInstant) : "",
                recoveryYears,
                formatDurationLabel(recoveryYears),
                returnPercent,
                usesCagr,
                recovered);
    }

    static String formatDurationLabel(double years) {
        int totalMonths = Math.max(0, (int) Math.round(years * 12));
        int y = totalMonths / 12;
        int m = totalMonths % 12;
        if (y > 0 && m > 0) {
            return y + "Y " + m + "M";
        }
        if (y > 0) {
            return y + "Y";
        }
        return m + "M";
    }

    static List<NavPoint> normalizeNav(List<NavPoint> nav) {
        return NavSeriesOrder.dedupeAndSort(nav);
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

    static List<DrawdownReport.NavIndexPoint> downsampleIndexedNav(
            List<DrawdownReport.NavIndexPoint> series,
            int maxPoints) {
        if (series.size() <= maxPoints) {
            return series;
        }

        int maxIdx = 0;
        int minIdx = 0;
        for (int i = 1; i < series.size(); i++) {
            if (series.get(i).indexValue() > series.get(maxIdx).indexValue()) {
                maxIdx = i;
            }
            if (series.get(i).indexValue() < series.get(minIdx).indexValue()) {
                minIdx = i;
            }
        }

        TreeSet<Integer> indices = new TreeSet<>();
        indices.add(0);
        indices.add(series.size() - 1);
        indices.add(maxIdx);
        indices.add(minIdx);

        int bucketCount = Math.max(1, maxPoints - indices.size());
        int bucketSize = (int) Math.ceil((double) series.size() / bucketCount);
        for (int start = 0; start < series.size(); start += bucketSize) {
            int end = Math.min(start + bucketSize, series.size());
            indices.add(start);
            indices.add(end - 1);
        }

        List<DrawdownReport.NavIndexPoint> sampled = new ArrayList<>(indices.size());
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
        Map<Integer, Double> yearMaxDd = new HashMap<>();

        for (NavPoint point : series) {
            int year = point.date().atZone(ZoneOffset.UTC).getYear();
            yearStart.putIfAbsent(year, point);
            yearEnd.put(year, point);
            yearPeak.merge(year, point.nav(), Math::max);

            double peak = yearPeak.get(year);
            double dd = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
            yearMaxDd.merge(year, dd, Math::min);
        }

        List<ConsistencyReport.CalendarYearReturn> calendarYears = new ArrayList<>();
        double worstYear = Double.MAX_VALUE;
        double bestYear = Double.MIN_VALUE;

        for (int year : yearStart.keySet().stream().sorted().toList()) {
            NavPoint start = yearStart.get(year);
            NavPoint end = yearEnd.get(year);
            double cyReturn = CalendarMath.absoluteReturn(start.nav(), end.nav());
            double maxDd = yearMaxDd.getOrDefault(year, 0.0);

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
