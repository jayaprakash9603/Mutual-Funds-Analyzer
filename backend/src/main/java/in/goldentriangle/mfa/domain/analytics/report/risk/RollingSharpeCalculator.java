package in.goldentriangle.mfa.domain.analytics.report.risk;

import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.analytics.NavSeriesOrder;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.risk.VolatilityReport.RollingSharpePoint;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Trailing 252-day annualised Sharpe for fund and (when available) benchmark.
 * Window cadence and thinning match {@link VolatilityCalculator#buildRollingSeries}.
 */
public class RollingSharpeCalculator {

    private static final int ROLLING_WINDOW = 252;
    private static final int DAILY_TRADING_DAYS = 252;
    private static final int MAX_POINTS = 600;
    private static final double MAX_GAP_DAYS = 7;
    private static final double MILLIS_PER_DAY = 1000.0 * 60 * 60 * 24;
    private static final double DEFAULT_RISK_FREE_RATE = 0.06;
    private static final DateTimeFormatter DAY_FMT =
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    private final double riskFreeRate;

    public RollingSharpeCalculator() {
        this(DEFAULT_RISK_FREE_RATE);
    }

    public RollingSharpeCalculator(double riskFreeRate) {
        this.riskFreeRate = riskFreeRate;
    }

    public List<RollingSharpePoint> compute(List<NavPoint> fundNav, List<NavPoint> benchmarkNav) {
        List<NavPoint> fundSeries = NavSeriesOrder.dedupeAndSort(fundNav);
        List<NavPoint> benchmarkSeries = NavSeriesOrder.dedupeAndSort(benchmarkNav);
        List<PeriodReturn> dailyReturns = buildDailyReturns(fundSeries);
        if (dailyReturns.size() < ROLLING_WINDOW) {
            return List.of();
        }

        boolean benchmarkAvailable = !benchmarkSeries.isEmpty();
        List<PeriodReturn> benchmarkDaily = benchmarkAvailable
                ? buildDailyReturnsFromCommon(fundSeries, benchmarkSeries)
                : List.of();

        List<RollingSharpePoint> fullSeries = new ArrayList<>();
        for (int i = ROLLING_WINDOW; i <= dailyReturns.size(); i++) {
            List<PeriodReturn> window = dailyReturns.subList(i - ROLLING_WINDOW, i);
            double fundSharpe = sharpe(window);

            double benchSharpe = 0;
            if (benchmarkAvailable && benchmarkDaily.size() >= i) {
                List<PeriodReturn> benchWindow = benchmarkDaily.subList(i - ROLLING_WINDOW, i);
                benchSharpe = sharpe(benchWindow);
            }

            fullSeries.add(new RollingSharpePoint(
                    window.get(window.size() - 1).date(),
                    fundSharpe,
                    benchSharpe));
        }

        return thinSeries(fullSeries, MAX_POINTS);
    }

    private double sharpe(List<PeriodReturn> window) {
        List<Double> fractions = window.stream().map(PeriodReturn::returnFraction).toList();
        double annVol = CalendarMath.annualiseDailyVolatility(
                Statistics.stdDev(fractions), DAILY_TRADING_DAYS);
        if (annVol == 0) {
            return 0;
        }
        double annReturn = Statistics.mean(fractions) * DAILY_TRADING_DAYS;
        return (annReturn - riskFreeRate) / annVol;
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
                returns.add(new PeriodReturn(
                        formatDay(curr.date()),
                        curr.benchmarkNav() / prev.benchmarkNav() - 1));
            }
        }
        return returns;
    }

    private static List<RollingSharpePoint> thinSeries(List<RollingSharpePoint> series, int maxPoints) {
        if (series.size() <= maxPoints) {
            return series;
        }
        int step = (int) Math.ceil((double) series.size() / maxPoints);
        List<RollingSharpePoint> thinned = new ArrayList<>();
        for (int i = 0; i < series.size(); i += step) {
            thinned.add(series.get(i));
        }
        RollingSharpePoint last = series.get(series.size() - 1);
        if (thinned.isEmpty() || !thinned.get(thinned.size() - 1).date().equals(last.date())) {
            thinned.add(last);
        }
        return thinned;
    }

    private static String formatDay(Instant instant) {
        return DAY_FMT.format(instant.atZone(ZoneOffset.UTC));
    }

    private record PeriodReturn(String date, double returnFraction) {
    }
}
