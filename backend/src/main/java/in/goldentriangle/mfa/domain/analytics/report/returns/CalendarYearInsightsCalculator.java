package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarYearInsightsReport;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

public class CalendarYearInsightsCalculator {

    private static final double DEBT_ANNUAL_RETURN_PERCENT = 6.0;
    private static final int ROLLING_WINDOW_YEARS = 10;
    private static final double LONG_TERM_BAND_LOW = 10.0;
    private static final double LONG_TERM_BAND_HIGH = 15.0;
    private static final double ATH_EPSILON = 1e-9;

    private record ReturnBucketDef(String label, double minInclusive, Double maxExclusive) {
    }

    private static final double WORST_BUCKET_FLOOR = -1000.0;

    private static final List<ReturnBucketDef> BUCKET_DEFS = List.of(
            new ReturnBucketDef("-30% or worse", WORST_BUCKET_FLOOR, -30.0),
            new ReturnBucketDef("-30% to -20%", -30.0, -20.0),
            new ReturnBucketDef("-20% to -10%", -20.0, -10.0),
            new ReturnBucketDef("-10% to 0%", -10.0, 0.0),
            new ReturnBucketDef("0% to 10%", 0.0, 10.0),
            new ReturnBucketDef("10% to 20%", 10.0, 20.0),
            new ReturnBucketDef("20% to 30%", 20.0, 30.0),
            new ReturnBucketDef("30% or better", 30.0, null));

    public CalendarYearInsightsReport compute(List<NavPoint> fundNav, ConsistencyReport consistency) {
        List<ConsistencyReport.CalendarYearReturn> calendarYears = consistency.calendarYears().stream()
                .sorted(Comparator.comparingInt(ConsistencyReport.CalendarYearReturn::year))
                .toList();

        if (calendarYears.isEmpty()) {
            return emptyReport();
        }

        List<NavPoint> sortedNav = fundNav.stream()
                .sorted(Comparator.comparing(NavPoint::date))
                .toList();

        return new CalendarYearInsightsReport(
                buildDistribution(calendarYears),
                buildSortedReturns(calendarYears, sortedNav),
                buildProfitBooking(sortedNav));
    }

    private static CalendarYearInsightsReport.AnnualReturnDistribution buildDistribution(
            List<ConsistencyReport.CalendarYearReturn> calendarYears) {
        int total = calendarYears.size();
        int[] counts = new int[BUCKET_DEFS.size()];

        for (ConsistencyReport.CalendarYearReturn year : calendarYears) {
            for (int i = 0; i < BUCKET_DEFS.size(); i++) {
                if (matchesBucket(year.returnPercent(), BUCKET_DEFS.get(i))) {
                    counts[i]++;
                    break;
                }
            }
        }

        List<CalendarYearInsightsReport.ReturnBucket> buckets = new ArrayList<>();
        for (int i = 0; i < BUCKET_DEFS.size(); i++) {
            ReturnBucketDef def = BUCKET_DEFS.get(i);
            buckets.add(new CalendarYearInsightsReport.ReturnBucket(
                    def.label(),
                    def.minInclusive(),
                    def.maxExclusive(),
                    total == 0 ? 0 : counts[i] * 100.0 / total,
                    counts[i]));
        }

        int positive = (int) calendarYears.stream().filter(y -> y.returnPercent() > 0).count();
        int negative = total - positive;
        double positivePercent = total == 0 ? 0 : positive * 100.0 / total;
        double negativePercent = total == 0 ? 0 : negative * 100.0 / total;
        String headline = "While this fund delivered positive calendar-year returns in "
                + String.format(Locale.ENGLISH, "%.0f", positivePercent)
                + "% of years, short-term outcomes remain widely dispersed.";

        return new CalendarYearInsightsReport.AnnualReturnDistribution(
                buckets,
                positivePercent,
                negativePercent,
                positive,
                negative,
                total,
                headline);
    }

    private static CalendarYearInsightsReport.SortedCalendarReturns buildSortedReturns(
            List<ConsistencyReport.CalendarYearReturn> calendarYears,
            List<NavPoint> sortedNav) {
        Instant first = sortedNav.get(0).date();
        Instant last = sortedNav.get(sortedNav.size() - 1).date();
        double years = CalendarMath.yearsBetweenMillis(first.toEpochMilli(), last.toEpochMilli());
        double cagr = CalendarMath.cagr(sortedNav.get(0).nav(), sortedNav.get(sortedNav.size() - 1).nav(), years);
        double multiple = CalendarMath.moneyMultiplied(sortedNav.get(0).nav(), sortedNav.get(sortedNav.size() - 1).nav());

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy", Locale.ENGLISH).withZone(ZoneOffset.UTC);
        String periodLabel = fmt.format(first) + " - " + fmt.format(last);

        List<CalendarYearInsightsReport.RankedYearReturn> ranked = calendarYears.stream()
                .sorted(Comparator.comparingDouble(ConsistencyReport.CalendarYearReturn::returnPercent).reversed())
                .map(y -> new CalendarYearInsightsReport.RankedYearReturn(
                        y.year(),
                        y.returnPercent(),
                        y.returnPercent() >= LONG_TERM_BAND_LOW && y.returnPercent() <= LONG_TERM_BAND_HIGH))
                .toList();

        long inBand = ranked.stream().filter(CalendarYearInsightsReport.RankedYearReturn::inLongTermBand).count();
        String headline = "Calendar-year returns are volatile and rarely sit inside the "
                + String.format(Locale.ENGLISH, "%.0f", LONG_TERM_BAND_LOW)
                + "%–"
                + String.format(Locale.ENGLISH, "%.0f", LONG_TERM_BAND_HIGH)
                + "% band — only "
                + inBand
                + " of "
                + ranked.size()
                + " years landed there.";

        return new CalendarYearInsightsReport.SortedCalendarReturns(
                periodLabel,
                cagr,
                multiple,
                LONG_TERM_BAND_LOW,
                LONG_TERM_BAND_HIGH,
                ranked,
                headline);
    }

    private static CalendarYearInsightsReport.ProfitBookingComparison buildProfitBooking(List<NavPoint> sortedNav) {
        Map<Integer, List<NavPoint>> byYear = sortedNav.stream()
                .collect(Collectors.groupingBy(
                        p -> p.date().atZone(ZoneOffset.UTC).getYear(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<Integer> years = byYear.keySet().stream().sorted().toList();
        List<CalendarYearInsightsReport.ProfitBookingRow> rows = new ArrayList<>();

        for (int i = 0; i <= years.size() - ROLLING_WINDOW_YEARS; i++) {
            int startYear = years.get(i);
            int endYear = startYear + ROLLING_WINDOW_YEARS - 1;
            List<NavPoint> window = sortedNav.stream()
                    .filter(p -> {
                        int year = p.date().atZone(ZoneOffset.UTC).getYear();
                        return year >= startYear && year <= endYear;
                    })
                    .toList();
            if (window.size() < 2) {
                continue;
            }

            double buyHold = simulateBuyHold(window);
            rows.add(new CalendarYearInsightsReport.ProfitBookingRow(
                    startYear + " to " + endYear,
                    startYear,
                    endYear,
                    buyHold,
                    buyHold - simulateProfitBooking(window, 20, false),
                    buyHold - simulateProfitBooking(window, 30, false),
                    buyHold - simulateProfitBooking(window, 50, false),
                    buyHold - simulateProfitBooking(window, 0, true)));
        }

        String headline = rows.isEmpty()
                ? "Need at least ten calendar years of NAV history to compare buy-and-hold with profit-booking rules."
                : "Never interrupt compounding — profit booking at market highs usually underperforms staying invested.";

        String methodology = "Buy & hold stays in the fund. Profit-booking rules move proceeds into a "
                + String.format(Locale.ENGLISH, "%.0f", DEBT_ANNUAL_RETURN_PERCENT)
                + "% debt proxy once the trigger is hit and remain there for the rest of the "
                + ROLLING_WINDOW_YEARS
                + "-year window. Taxes are excluded.";

        return new CalendarYearInsightsReport.ProfitBookingComparison(
                ROLLING_WINDOW_YEARS,
                DEBT_ANNUAL_RETURN_PERCENT,
                rows,
                headline,
                methodology);
    }

    private static double simulateBuyHold(List<NavPoint> window) {
        double years = CalendarMath.yearsBetweenMillis(
                window.get(0).date().toEpochMilli(),
                window.get(window.size() - 1).date().toEpochMilli());
        return CalendarMath.cagr(window.get(0).nav(), window.get(window.size() - 1).nav(), years);
    }

    private static double simulateProfitBooking(
            List<NavPoint> window,
            double gainTriggerPercent,
            boolean allTimeHighTrigger) {
        double initialInvestment = 1.0;
        double initialNav = window.get(0).nav();
        double units = initialInvestment / initialNav;
        double portfolio = initialInvestment;
        boolean inDebt = false;
        double runningMaxNav = initialNav;
        Instant lastDate = window.get(0).date();

        for (int i = 1; i < window.size(); i++) {
            NavPoint point = window.get(i);
            if (inDebt) {
                portfolio = compoundDebt(portfolio, lastDate, point.date());
            } else {
                portfolio = units * point.nav();
                if (allTimeHighTrigger) {
                    if (point.nav() > runningMaxNav + ATH_EPSILON) {
                        runningMaxNav = point.nav();
                        inDebt = true;
                    }
                } else if ((portfolio / initialInvestment - 1) * 100 >= gainTriggerPercent) {
                    inDebt = true;
                }
            }
            lastDate = point.date();
        }

        double years = CalendarMath.yearsBetweenMillis(
                window.get(0).date().toEpochMilli(),
                window.get(window.size() - 1).date().toEpochMilli());
        return CalendarMath.cagr(initialInvestment, portfolio, years);
    }

    private static double compoundDebt(double value, Instant from, Instant to) {
        if (value <= 0) {
            return 0;
        }
        double years = CalendarMath.yearsBetweenMillis(from.toEpochMilli(), to.toEpochMilli());
        return value * Math.pow(1 + DEBT_ANNUAL_RETURN_PERCENT / 100, years);
    }

    private static boolean matchesBucket(double value, ReturnBucketDef def) {
        if (def.maxExclusive() == null) {
            return value >= def.minInclusive();
        }
        return value >= def.minInclusive() && value < def.maxExclusive();
    }

    private static CalendarYearInsightsReport emptyReport() {
        return new CalendarYearInsightsReport(
                new CalendarYearInsightsReport.AnnualReturnDistribution(
                        List.of(), 0, 0, 0, 0, 0, ""),
                new CalendarYearInsightsReport.SortedCalendarReturns(
                        "", 0, 0, LONG_TERM_BAND_LOW, LONG_TERM_BAND_HIGH, List.of(), ""),
                new CalendarYearInsightsReport.ProfitBookingComparison(
                        ROLLING_WINDOW_YEARS, DEBT_ANNUAL_RETURN_PERCENT, List.of(), "", ""));
    }
}
