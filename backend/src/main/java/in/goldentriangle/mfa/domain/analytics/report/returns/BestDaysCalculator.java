package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.BestDaysReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public class BestDaysCalculator {

    private static final double MILLIS_PER_DAY = 1000.0 * 60 * 60 * 24;
    private static final double MAX_GAP_DAYS = 7;
    private static final double DEFAULT_PRINCIPAL = 1_000_000;
    private static final int TOP_RANK_LIMIT = 30;
    private static final int[] MISS_COUNTS = {0, 5, 10, 15, 20, 25, 30, 40, 50};
    private static final int[] TOP_CUMULATIVE_COUNTS = {5, 10, 15, 20};
    private static final int WORST_DAYS_FOR_PROXIMITY = 10;
    private static final int PROXIMITY_DAYS = 14;

    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("dd-MMM-yy", Locale.ENGLISH).withZone(ZoneOffset.UTC);

    private record DailyReturn(String date, double returnFraction) {
        double returnPercent() {
            return returnFraction * 100;
        }
    }

    private record CrashWindow(String label, String startDate, String endDate, String marketFallLabel) {
    }

    private static final List<CrashWindow> CRASH_WINDOWS = List.of(
            new CrashWindow("2006: FII & DII sell-off", "2006-05-01", "2006-06-30", "−30%"),
            new CrashWindow("2008: Global Financial Crisis", "2008-01-01", "2009-03-31", "−60%"),
            new CrashWindow("2020: Covid-19 Pandemic", "2020-02-01", "2020-04-30", "−40%"));

    public BestDaysReport compute(List<NavPoint> fundNav) {
        List<DailyReturn> dailyReturns = buildDailyReturns(fundNav);
        if (dailyReturns.size() < 30) {
            return emptyReport(fundNav);
        }

        Instant first = fundNav.get(0).date();
        Instant last = fundNav.get(fundNav.size() - 1).date();
        double years = CalendarMath.yearsBetweenMillis(first.toEpochMilli(), last.toEpochMilli());
        String periodLabel = formatPeriodLabel(first, last);

        List<DailyReturn> ranked = dailyReturns.stream()
                .sorted(Comparator.comparingDouble(DailyReturn::returnFraction).reversed())
                .toList();

        List<BestDaysReport.MissingBestDaysScenario> scenarios = buildMissingScenarios(dailyReturns, ranked, years);
        double baselineValue = scenarios.isEmpty() ? DEFAULT_PRINCIPAL : scenarios.get(0).finalValue();

        List<BestDaysReport.MissingBestDaysScenario> normalizedScenarios = scenarios.stream()
                .map(s -> new BestDaysReport.MissingBestDaysScenario(
                        s.missCount(),
                        s.label(),
                        s.finalValue(),
                        s.cagrPercent(),
                        lowerByPercent(s.missCount(), s.finalValue(), baselineValue)))
                .toList();

        List<BestDaysReport.BestDayEntry> topBestDays = new ArrayList<>();
        for (int i = 0; i < Math.min(TOP_RANK_LIMIT, ranked.size()); i++) {
            DailyReturn day = ranked.get(i);
            topBestDays.add(new BestDaysReport.BestDayEntry(
                    i + 1, formatDisplayDate(day.date()), day.returnPercent()));
        }

        List<BestDaysReport.CrashPeriodBestDays> crashPeriods = buildCrashPeriods(ranked);
        List<BestDaysReport.TopDaysCumulative> cumulative = buildTopCumulative(ranked);
        BestDaysReport.BestWorstProximityInsight proximity = buildProximityInsight(ranked, dailyReturns);
        String headline = buildHeadline(normalizedScenarios);

        return new BestDaysReport(
                DEFAULT_PRINCIPAL,
                periodLabel,
                normalizedScenarios,
                topBestDays,
                crashPeriods,
                cumulative,
                proximity,
                headline);
    }

    private static BestDaysReport emptyReport(List<NavPoint> fundNav) {
        String periodLabel = fundNav.isEmpty()
                ? "Insufficient history"
                : formatPeriodLabel(fundNav.get(0).date(), fundNav.get(fundNav.size() - 1).date());
        return new BestDaysReport(
                DEFAULT_PRINCIPAL,
                periodLabel,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                new BestDaysReport.BestWorstProximityInsight(0, WORST_DAYS_FOR_PROXIMITY, TOP_RANK_LIMIT, ""),
                "");
    }

    private static List<DailyReturn> buildDailyReturns(List<NavPoint> series) {
        List<DailyReturn> returns = new ArrayList<>();
        for (int i = 1; i < series.size(); i++) {
            NavPoint prev = series.get(i - 1);
            NavPoint curr = series.get(i);
            double days = (curr.date().toEpochMilli() - prev.date().toEpochMilli()) / MILLIS_PER_DAY;
            if (days > 0 && days <= MAX_GAP_DAYS && prev.nav() > 0) {
                returns.add(new DailyReturn(
                        NavDateParser.dateKey(curr.date()),
                        curr.nav() / prev.nav() - 1));
            }
        }
        return returns;
    }

    private static List<BestDaysReport.MissingBestDaysScenario> buildMissingScenarios(
            List<DailyReturn> chronological,
            List<DailyReturn> ranked,
            double years) {
        List<BestDaysReport.MissingBestDaysScenario> scenarios = new ArrayList<>();
        for (int missCount : MISS_COUNTS) {
            if (missCount > ranked.size()) {
                continue;
            }
            Set<String> exclude = ranked.stream()
                    .limit(missCount)
                    .map(DailyReturn::date)
                    .collect(Collectors.toSet());
            double finalValue = compoundReturns(chronological, exclude);
            double cagr = years > 0 ? (Math.pow(finalValue / DEFAULT_PRINCIPAL, 1 / years) - 1) * 100 : 0;
            scenarios.add(new BestDaysReport.MissingBestDaysScenario(
                    missCount,
                    missCount == 0 ? "Entire period" : "Miss " + missCount + " best days",
                    finalValue,
                    cagr,
                    0));
        }
        return scenarios;
    }

    private static double compoundReturns(List<DailyReturn> chronological, Set<String> excludeDates) {
        double value = DEFAULT_PRINCIPAL;
        for (DailyReturn day : chronological) {
            if (!excludeDates.contains(day.date())) {
                value *= 1 + day.returnFraction();
            }
        }
        return value;
    }

    static double lowerByPercent(int missCount, double finalValue, double baselineValue) {
        if (missCount == 0) {
            return 0;
        }
        if (baselineValue <= 0 || !Double.isFinite(baselineValue)) {
            return 0;
        }
        double pct = (1 - finalValue / baselineValue) * 100;
        if (!Double.isFinite(pct)) {
            return 0;
        }
        return Math.max(0, pct);
    }

    private static List<BestDaysReport.CrashPeriodBestDays> buildCrashPeriods(List<DailyReturn> ranked) {
        List<BestDaysReport.CrashPeriodBestDays> periods = new ArrayList<>();
        Set<String> assigned = new HashSet<>();

        for (CrashWindow window : CRASH_WINDOWS) {
            List<BestDaysReport.BestDayInPeriod> inPeriod = new ArrayList<>();
            for (int i = 0; i < ranked.size() && i < TOP_RANK_LIMIT; i++) {
                DailyReturn day = ranked.get(i);
                if (day.date().compareTo(window.startDate()) >= 0
                        && day.date().compareTo(window.endDate()) <= 0) {
                    assigned.add(day.date());
                    inPeriod.add(new BestDaysReport.BestDayInPeriod(
                            i + 1,
                            formatDisplayDate(day.date()),
                            day.returnPercent()));
                }
            }
            if (!inPeriod.isEmpty()) {
                periods.add(new BestDaysReport.CrashPeriodBestDays(
                        window.label(),
                        window.marketFallLabel(),
                        inPeriod.size(),
                        TOP_RANK_LIMIT,
                        inPeriod));
            }
        }

        List<BestDaysReport.BestDayInPeriod> others = new ArrayList<>();
        for (int i = 0; i < ranked.size() && i < TOP_RANK_LIMIT; i++) {
            DailyReturn day = ranked.get(i);
            if (!assigned.contains(day.date())) {
                others.add(new BestDaysReport.BestDayInPeriod(
                        i + 1,
                        formatDisplayDate(day.date()),
                        day.returnPercent()));
            }
        }
        if (!others.isEmpty()) {
            periods.add(new BestDaysReport.CrashPeriodBestDays(
                    "Others",
                    "",
                    others.size(),
                    TOP_RANK_LIMIT,
                    others));
        }
        return periods;
    }

    private static List<BestDaysReport.TopDaysCumulative> buildTopCumulative(List<DailyReturn> ranked) {
        List<BestDaysReport.TopDaysCumulative> rows = new ArrayList<>();
        for (int count : TOP_CUMULATIVE_COUNTS) {
            if (count > ranked.size()) {
                continue;
            }
            double cumulative = 1;
            for (int i = 0; i < count; i++) {
                cumulative *= 1 + ranked.get(i).returnFraction();
            }
            rows.add(new BestDaysReport.TopDaysCumulative(count, (cumulative - 1) * 100));
        }
        return rows;
    }

    private static BestDaysReport.BestWorstProximityInsight buildProximityInsight(
            List<DailyReturn> ranked,
            List<DailyReturn> chronological) {
        List<DailyReturn> worst = chronological.stream()
                .sorted(Comparator.comparingDouble(DailyReturn::returnFraction))
                .limit(WORST_DAYS_FOR_PROXIMITY)
                .toList();

        Set<String> topDates = ranked.stream()
                .limit(TOP_RANK_LIMIT)
                .map(DailyReturn::date)
                .collect(Collectors.toSet());

        int nearWorst = 0;
        String example = "";
        for (String topDate : topDates) {
            Instant topInstant = Instant.parse(topDate + "T00:00:00Z");
            for (DailyReturn bad : worst) {
                Instant badInstant = Instant.parse(bad.date() + "T00:00:00Z");
                long daysApart = Math.abs(ChronoUnit.DAYS.between(topInstant, badInstant));
                if (daysApart <= PROXIMITY_DAYS) {
                    nearWorst++;
                    if (example.isBlank()) {
                        example = "Eg: a top-ranked day on "
                                + formatDisplayDate(topDate)
                                + " landed within "
                                + daysApart
                                + " days of a sharp fall on "
                                + formatDisplayDate(bad.date());
                    }
                    break;
                }
            }
        }

        return new BestDaysReport.BestWorstProximityInsight(
                nearWorst,
                WORST_DAYS_FOR_PROXIMITY,
                TOP_RANK_LIMIT,
                example);
    }

    private static String buildHeadline(List<BestDaysReport.MissingBestDaysScenario> scenarios) {
        BestDaysReport.MissingBestDaysScenario miss15 = scenarios.stream()
                .filter(s -> s.missCount() == 15)
                .findFirst()
                .orElse(null);
        if (miss15 == null || miss15.lowerByPercent() <= 0) {
            return "";
        }
        int lostFraction = (int) Math.round(miss15.lowerByPercent() / 33.33);
        String fractionText = lostFraction >= 2 ? "2/3rd" : "a large share";
        return "If you missed the 15 best days in the analysis period, your portfolio lost "
                + fractionText
                + " of its value compared to staying fully invested.";
    }

    private static String formatPeriodLabel(Instant first, Instant last) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM-yy", Locale.ENGLISH).withZone(ZoneOffset.UTC);
        return fmt.format(first) + " to " + fmt.format(last);
    }

    private static String formatDisplayDate(String isoDate) {
        return DISPLAY_DATE.format(Instant.parse(isoDate + "T00:00:00Z"));
    }
}
