package in.goldentriangle.mfa.domain.analytics.report.risk;

import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.analytics.NavSeriesOrder;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.RiskLevel;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport.PeriodVolatility;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport.ReturnBucket;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport.RollingVolatilityPoint;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport.RollingVolatilitySummary;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class VolatilityCalculator {

    private static final double PERCENT = 100;
    private static final double MAX_GAP_DAYS = 7;
    private static final double MILLIS_PER_DAY = 1000.0 * 60 * 60 * 24;
    private static final int DAILY_TRADING_DAYS = 252;
    private static final int WEEKLY_PERIODS = 52;
    private static final int MONTHLY_PERIODS = 12;
    private static final int ROLLING_WINDOW = 252;
    private static final int MAX_ROLLING_POINTS = 600;
    private static final double DISTRIBUTION_LOWER_OPEN = -1000;
    private static final double DISTRIBUTION_UPPER_OPEN = 1000;
    private static final DateTimeFormatter PERIOD_FMT =
            DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter DAY_FMT =
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    private record PeriodReturn(String date, double returnFraction) {
    }

    public VolatilityReport compute(List<NavPoint> fundNav, List<NavPoint> benchmarkNav) {
        List<NavPoint> fundSeries = NavSeriesOrder.dedupeAndSort(fundNav);
        List<NavPoint> benchmarkSeries = NavSeriesOrder.dedupeAndSort(benchmarkNav);
        if (fundSeries.size() < 2) {
            return empty(fundSeries);
        }

        String periodLabel = formatPeriodLabel(fundSeries);
        List<PeriodReturn> dailyReturns = buildDailyReturns(fundSeries);
        if (dailyReturns.size() < 2) {
            return empty(fundSeries);
        }

        List<NavPoint> weeklyNav = lastNavPerWeek(fundSeries);
        List<NavPoint> monthlyNav = lastNavPerMonth(fundSeries);
        List<PeriodReturn> weeklyReturns = buildPeriodReturns(weeklyNav);
        List<PeriodReturn> monthlyReturns = buildPeriodReturns(monthlyNav);

        boolean benchmarkAvailable = !benchmarkSeries.isEmpty();
        List<PeriodReturn> benchmarkDaily = benchmarkAvailable
                ? buildDailyReturnsFromCommon(fundSeries, benchmarkSeries)
                : List.of();
        List<PeriodReturn> benchmarkWeekly = benchmarkAvailable
                ? buildPeriodReturns(lastNavPerWeek(benchmarkSeries))
                : List.of();
        List<PeriodReturn> benchmarkMonthly = benchmarkAvailable
                ? buildPeriodReturns(lastNavPerMonth(benchmarkSeries))
                : List.of();

        List<PeriodVolatility> periods = List.of(
                buildPeriodVolatility("Daily", dailyReturns, benchmarkDaily, DAILY_TRADING_DAYS),
                buildPeriodVolatility("Weekly", weeklyReturns, benchmarkWeekly, WEEKLY_PERIODS),
                buildPeriodVolatility("Monthly", monthlyReturns, benchmarkMonthly, MONTHLY_PERIODS));

        List<RollingVolatilityPoint> rollingSeries = buildRollingSeries(fundSeries, benchmarkSeries, benchmarkAvailable);
        RollingVolatilitySummary rollingSummary = buildRollingSummary(rollingSeries);
        List<ReturnBucket> distribution = buildDistribution(dailyReturns);

        double dailyAnnualised = periods.get(0).annualisedVolatilityPercent();
        String volatilityBand = RiskLevel.forVolatility(dailyAnnualised).label();
        String headline = buildHeadline(dailyAnnualised, volatilityBand, periods.get(0));

        return new VolatilityReport(
                periodLabel,
                benchmarkAvailable,
                periods,
                rollingSeries,
                rollingSummary,
                distribution,
                volatilityBand,
                headline);
    }

    private static PeriodVolatility buildPeriodVolatility(
            String frequency,
            List<PeriodReturn> returns,
            List<PeriodReturn> benchmarkReturns,
            int periodsPerYear) {
        if (returns.isEmpty()) {
            return new PeriodVolatility(
                    frequency, 0, 0, 0, 0, 0, 0, "", 0, "", 0, 0, 0, 0, 0);
        }

        List<Double> fractions = returns.stream().map(PeriodReturn::returnFraction).toList();
        double stdDevFraction = Statistics.stdDev(fractions);
        double stdDevPercent = stdDevFraction * PERCENT;
        double annualised = CalendarMath.annualiseDailyVolatility(stdDevFraction, periodsPerYear) * PERCENT;
        double averageReturn = Statistics.mean(fractions) * PERCENT;
        double typicalSwing = fractions.stream().mapToDouble(Math::abs).average().orElse(0) * PERCENT;

        PeriodReturn best = returns.stream().max(Comparator.comparingDouble(PeriodReturn::returnFraction)).orElseThrow();
        PeriodReturn worst = returns.stream().min(Comparator.comparingDouble(PeriodReturn::returnFraction)).orElseThrow();

        long positive = fractions.stream().filter(v -> v > 0).count();
        long negative = fractions.stream().filter(v -> v < 0).count();
        double positivePercent = positive * PERCENT / fractions.size();
        double negativePercent = negative * PERCENT / fractions.size();

        double benchmarkAnnualised = 0;
        double benchmarkBest = 0;
        double benchmarkWorst = 0;
        if (!benchmarkReturns.isEmpty()) {
            List<Double> benchFractions = benchmarkReturns.stream().map(PeriodReturn::returnFraction).toList();
            benchmarkAnnualised = CalendarMath.annualiseDailyVolatility(
                    Statistics.stdDev(benchFractions), periodsPerYear) * PERCENT;
            benchmarkBest = benchFractions.stream().mapToDouble(Double::doubleValue).max().orElse(0) * PERCENT;
            benchmarkWorst = benchFractions.stream().mapToDouble(Double::doubleValue).min().orElse(0) * PERCENT;
        }

        return new PeriodVolatility(
                frequency,
                fractions.size(),
                stdDevPercent,
                annualised,
                averageReturn,
                typicalSwing,
                best.returnFraction() * PERCENT,
                best.date(),
                worst.returnFraction() * PERCENT,
                worst.date(),
                positivePercent,
                negativePercent,
                benchmarkAnnualised,
                benchmarkBest,
                benchmarkWorst);
    }

    private static List<PeriodReturn> buildDailyReturns(List<NavPoint> series) {
        List<PeriodReturn> returns = new ArrayList<>();
        for (int i = 1; i < series.size(); i++) {
            NavPoint prev = series.get(i - 1);
            NavPoint curr = series.get(i);
            double days = (curr.date().toEpochMilli() - prev.date().toEpochMilli()) / MILLIS_PER_DAY;
            if (days > 0 && days <= MAX_GAP_DAYS && prev.nav() > 0) {
                returns.add(new PeriodReturn(formatDay(curr.date()), curr.nav() / prev.nav() - 1));
            }
        }
        return returns;
    }

    private static List<PeriodReturn> buildDailyReturnsFromCommon(
            List<NavPoint> fundSeries,
            List<NavPoint> benchmarkSeries) {
        List<NavSeriesBuilder.CommonNavPoint> common =
                NavSeriesBuilder.getCommonNavSeries(fundSeries, benchmarkSeries);
        List<PeriodReturn> returns = new ArrayList<>();
        for (int i = 1; i < common.size(); i++) {
            NavSeriesBuilder.CommonNavPoint prev = common.get(i - 1);
            NavSeriesBuilder.CommonNavPoint curr = common.get(i);
            double days = (curr.date().toEpochMilli() - prev.date().toEpochMilli()) / MILLIS_PER_DAY;
            if (days > 0 && days <= MAX_GAP_DAYS && prev.benchmarkNav() > 0) {
                returns.add(new PeriodReturn(formatDay(curr.date()), curr.benchmarkNav() / prev.benchmarkNav() - 1));
            }
        }
        return returns;
    }

    private static List<PeriodReturn> buildPeriodReturns(List<NavPoint> bucketedNav) {
        List<PeriodReturn> returns = new ArrayList<>();
        for (int i = 1; i < bucketedNav.size(); i++) {
            NavPoint prev = bucketedNav.get(i - 1);
            NavPoint curr = bucketedNav.get(i);
            if (prev.nav() > 0) {
                returns.add(new PeriodReturn(formatDay(curr.date()), curr.nav() / prev.nav() - 1));
            }
        }
        return returns;
    }

    private static List<NavPoint> lastNavPerWeek(List<NavPoint> series) {
        Map<String, NavPoint> byWeek = new LinkedHashMap<>();
        for (NavPoint point : series) {
            var localDate = point.date().atZone(ZoneOffset.UTC).toLocalDate();
            int week = localDate.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            int year = localDate.get(IsoFields.WEEK_BASED_YEAR);
            String key = year + "-W" + week;
            byWeek.put(key, point);
        }
        return byWeek.values().stream().sorted(Comparator.comparing(NavPoint::date)).toList();
    }

    private static List<NavPoint> lastNavPerMonth(List<NavPoint> series) {
        Map<String, NavPoint> byMonth = new LinkedHashMap<>();
        for (NavPoint point : series) {
            var localDate = point.date().atZone(ZoneOffset.UTC).toLocalDate();
            String key = localDate.getYear() + "-" + localDate.getMonthValue();
            byMonth.put(key, point);
        }
        return byMonth.values().stream().sorted(Comparator.comparing(NavPoint::date)).toList();
    }

    private static List<RollingVolatilityPoint> buildRollingSeries(
            List<NavPoint> fundSeries,
            List<NavPoint> benchmarkSeries,
            boolean benchmarkAvailable) {
        List<PeriodReturn> dailyReturns = buildDailyReturns(fundSeries);
        if (dailyReturns.size() < ROLLING_WINDOW) {
            return List.of();
        }

        List<PeriodReturn> benchmarkDaily = benchmarkAvailable
                ? buildDailyReturnsFromCommon(fundSeries, benchmarkSeries)
                : List.of();

        List<RollingVolatilityPoint> fullSeries = new ArrayList<>();
        for (int i = ROLLING_WINDOW; i <= dailyReturns.size(); i++) {
            List<PeriodReturn> window = dailyReturns.subList(i - ROLLING_WINDOW, i);
            List<Double> fractions = window.stream().map(PeriodReturn::returnFraction).toList();
            double fundVol = CalendarMath.annualiseDailyVolatility(
                    Statistics.stdDev(fractions), DAILY_TRADING_DAYS) * PERCENT;

            double benchVol = 0;
            if (benchmarkAvailable && benchmarkDaily.size() >= i) {
                List<PeriodReturn> benchWindow = benchmarkDaily.subList(i - ROLLING_WINDOW, i);
                List<Double> benchFractions = benchWindow.stream().map(PeriodReturn::returnFraction).toList();
                benchVol = CalendarMath.annualiseDailyVolatility(
                        Statistics.stdDev(benchFractions), DAILY_TRADING_DAYS) * PERCENT;
            }

            fullSeries.add(new RollingVolatilityPoint(window.get(window.size() - 1).date(), fundVol, benchVol));
        }

        return thinSeries(fullSeries, MAX_ROLLING_POINTS);
    }

    private static List<RollingVolatilityPoint> thinSeries(
            List<RollingVolatilityPoint> series,
            int maxPoints) {
        if (series.size() <= maxPoints) {
            return series;
        }
        int step = (int) Math.ceil((double) series.size() / maxPoints);
        List<RollingVolatilityPoint> thinned = new ArrayList<>();
        for (int i = 0; i < series.size(); i += step) {
            thinned.add(series.get(i));
        }
        RollingVolatilityPoint last = series.get(series.size() - 1);
        if (thinned.isEmpty() || !thinned.get(thinned.size() - 1).date().equals(last.date())) {
            thinned.add(last);
        }
        return thinned;
    }

    private static RollingVolatilitySummary buildRollingSummary(List<RollingVolatilityPoint> series) {
        if (series.isEmpty()) {
            return new RollingVolatilitySummary(ROLLING_WINDOW, 0, 0, 0, "", 0, "", 0, 0);
        }

        RollingVolatilityPoint current = series.get(series.size() - 1);
        List<Double> fundValues = series.stream().map(RollingVolatilityPoint::fundVolatilityPercent).toList();
        double average = Statistics.mean(fundValues);
        double max = fundValues.stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double min = fundValues.stream().mapToDouble(Double::doubleValue).min().orElse(0);
        RollingVolatilityPoint maxPoint = series.stream()
                .max(Comparator.comparingDouble(RollingVolatilityPoint::fundVolatilityPercent))
                .orElse(current);
        RollingVolatilityPoint minPoint = series.stream()
                .min(Comparator.comparingDouble(RollingVolatilityPoint::fundVolatilityPercent))
                .orElse(current);

        List<Double> benchValues = series.stream()
                .map(RollingVolatilityPoint::benchmarkVolatilityPercent)
                .filter(v -> v > 0)
                .toList();
        double benchAverage = benchValues.isEmpty() ? 0 : Statistics.mean(benchValues);

        long aboveBenchmark = series.stream()
                .filter(p -> p.benchmarkVolatilityPercent() > 0
                        && p.fundVolatilityPercent() > p.benchmarkVolatilityPercent())
                .count();
        long comparable = series.stream().filter(p -> p.benchmarkVolatilityPercent() > 0).count();
        double timeAbove = comparable == 0 ? 0 : aboveBenchmark * PERCENT / comparable;

        return new RollingVolatilitySummary(
                ROLLING_WINDOW,
                current.fundVolatilityPercent(),
                average,
                max,
                maxPoint.date(),
                min,
                minPoint.date(),
                benchAverage,
                timeAbove);
    }

    private static List<ReturnBucket> buildDistribution(List<PeriodReturn> dailyReturns) {
        double[][] bounds = {
                {DISTRIBUTION_LOWER_OPEN, -3},
                {-3, -2},
                {-2, -1},
                {-1, 0},
                {0, 1},
                {1, 2},
                {2, 3},
                {3, DISTRIBUTION_UPPER_OPEN}
        };
        String[] labels = {
                "< -3%",
                "-3% to -2%",
                "-2% to -1%",
                "-1% to 0%",
                "0% to 1%",
                "1% to 2%",
                "2% to 3%",
                "> 3%"
        };

        int total = dailyReturns.size();
        List<ReturnBucket> buckets = new ArrayList<>();
        for (int i = 0; i < bounds.length; i++) {
            double lower = bounds[i][0];
            double upper = bounds[i][1];
            int count = 0;
            for (PeriodReturn ret : dailyReturns) {
                double pct = ret.returnFraction() * PERCENT;
                boolean inBucket = i == 0
                        ? pct < upper
                        : i == bounds.length - 1
                                ? pct >= lower
                                : pct >= lower && pct < upper;
                if (inBucket) {
                    count++;
                }
            }
            double share = total == 0 ? 0 : count * PERCENT / total;
            buckets.add(new ReturnBucket(labels[i], lower, upper, count, share));
        }
        return buckets;
    }

    private static String buildHeadline(double dailyAnnualised, String band, PeriodVolatility daily) {
        return String.format(
                Locale.ENGLISH,
                "%s risk with %.1f%% annualised volatility; typical daily move ±%.2f%%",
                band,
                dailyAnnualised,
                daily.typicalSwingPercent());
    }

    private static String formatPeriodLabel(List<NavPoint> series) {
        if (series.isEmpty()) {
            return "Insufficient history";
        }
        return PERIOD_FMT.format(series.get(0).date().atZone(ZoneOffset.UTC))
                + " to "
                + PERIOD_FMT.format(series.get(series.size() - 1).date().atZone(ZoneOffset.UTC));
    }

    private static String formatDay(Instant instant) {
        return DAY_FMT.format(instant.atZone(ZoneOffset.UTC));
    }

    private static VolatilityReport empty(List<NavPoint> series) {
        return new VolatilityReport(
                formatPeriodLabel(series),
                false,
                List.of(),
                List.of(),
                new RollingVolatilitySummary(ROLLING_WINDOW, 0, 0, 0, "", 0, "", 0, 0),
                List.of(),
                RiskLevel.MEDIUM.label(),
                "Insufficient history for volatility analysis");
    }
}
