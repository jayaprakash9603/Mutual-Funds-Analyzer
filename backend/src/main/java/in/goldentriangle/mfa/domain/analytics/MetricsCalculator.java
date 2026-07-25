package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.AlignedRollingPoint;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.RiskLevel;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.List;

public class MetricsCalculator {

    private static final double PERCENT = 100;
    private static final double DAYS_PER_YEAR = 365.25;

    private final double riskFreeRate;
    private final int tradingDays;
    private final Clock clock;

    public MetricsCalculator(double riskFreeRate, int tradingDays, Clock clock) {
        this.riskFreeRate = riskFreeRate;
        this.tradingDays = tradingDays;
        this.clock = clock;
    }

    public FundMetrics compute(AnalysisInput input) {
        DoubleSummaryStatistics fundRolling = summarise(input.fund());
        DoubleSummaryStatistics benchmarkRolling = summarise(input.benchmark());

        List<NavPoint> fundNav = NavSeriesBuilder.buildNavSeries(input.fund());
        List<NavPoint> benchmarkNav = NavSeriesBuilder.buildNavSeries(input.benchmark());
        DailyReturns daily = input.benchmark().isEmpty()
                ? fundOnlyDailyReturns(fundNav)
                : alignedDailyReturns(fundNav, benchmarkNav);

        double fundAnnReturn = annualisedReturn(daily.fund()) * PERCENT;
        double benchmarkAnnReturn = input.benchmark().isEmpty()
                ? 0
                : annualisedReturn(daily.benchmark()) * PERCENT;
        double fundVolatility = annualisedVolatility(daily.fund()) * PERCENT;
        double benchmarkVolatility = input.benchmark().isEmpty()
                ? 0
                : annualisedVolatility(daily.benchmark()) * PERCENT;

        double beta = input.benchmark().isEmpty() ? 0 : beta(daily);
        double fundSharpe = sharpeRatio(daily.fund());
        double benchmarkSharpe = input.benchmark().isEmpty() ? 0 : sharpeRatio(daily.benchmark());
        double cob = input.benchmark().isEmpty() ? 0 : chanceOfBeating(input);

        return new FundMetrics(
                fundRolling.getAverage(),
                benchmarkRolling.getAverage(),
                maxOrZero(fundRolling),
                minOrZero(fundRolling),
                maxOrZero(benchmarkRolling),
                minOrZero(benchmarkRolling),
                cob,
                fundSharpe,
                benchmarkSharpe,
                fundAnnReturn,
                benchmarkAnnReturn,
                fundVolatility,
                benchmarkVolatility,
                input.benchmark().isEmpty() ? 0 : alpha(fundAnnReturn, benchmarkAnnReturn, beta),
                beta,
                sortinoRatio(daily.fund()),
                input.benchmark().isEmpty() ? 0 : treynorRatio(daily.fund(), beta),
                input.benchmark().isEmpty() ? 0 : informationRatio(daily),
                maxDrawdown(fundNav),
                input.benchmark().isEmpty() ? 0 : maxDrawdown(benchmarkNav),
                totalReturn(fundNav),
                input.benchmark().isEmpty() ? 0 : totalReturn(benchmarkNav),
                RiskLevel.forVolatility(fundVolatility).label(),
                fundAgeYears(fundNav),
                consistencyScore(
                        cob,
                        input.benchmark().isEmpty() ? fundSharpe > 0 : fundSharpe > benchmarkSharpe,
                        input.benchmark().isEmpty()
                                ? fundRolling.getAverage() > 0
                                : fundRolling.getAverage() > benchmarkRolling.getAverage()));
    }

    private DailyReturns fundOnlyDailyReturns(List<NavPoint> fundNav) {
        List<Double> fundDaily = NavSeriesBuilder.computeDailyReturns(fundNav);
        return new DailyReturns(fundDaily, List.of());
    }

    private static DoubleSummaryStatistics summarise(List<RollingReturnRow> rows) {
        return rows.stream().mapToDouble(RollingReturnRow::schemeRollingReturns).summaryStatistics();
    }

    private static double maxOrZero(DoubleSummaryStatistics stats) {
        return stats.getCount() == 0 ? 0 : stats.getMax();
    }

    private static double minOrZero(DoubleSummaryStatistics stats) {
        return stats.getCount() == 0 ? 0 : stats.getMin();
    }

    /** Daily returns are only comparable on dates where both series have a NAV. */
    private DailyReturns alignedDailyReturns(List<NavPoint> fundNav, List<NavPoint> benchmarkNav) {
        var commonNav = NavSeriesBuilder.getCommonNavSeries(fundNav, benchmarkNav);
        List<Double> fundDaily = NavSeriesBuilder.computeDailyReturns(
                commonNav.stream().map(p -> new NavPoint(p.date(), p.fundNav())).toList());
        List<Double> benchmarkDaily = NavSeriesBuilder.computeDailyReturns(
                commonNav.stream().map(p -> new NavPoint(p.date(), p.benchmarkNav())).toList());

        int minLen = Math.min(fundDaily.size(), benchmarkDaily.size());
        return new DailyReturns(fundDaily.subList(0, minLen), benchmarkDaily.subList(0, minLen));
    }

    private double chanceOfBeating(AnalysisInput input) {
        List<AlignedRollingPoint> aligned = NavSeriesBuilder.alignRollingReturns(input.fund(), input.benchmark());
        if (aligned.isEmpty()) {
            return 0;
        }
        long wins = aligned.stream().filter(p -> p.fundReturn() > p.benchmarkReturn()).count();
        return wins * PERCENT / aligned.size();
    }

    private double beta(DailyReturns daily) {
        double benchmarkVariance = Statistics.variance(daily.benchmark());
        if (benchmarkVariance == 0) {
            return 0;
        }
        return Statistics.covariance(daily.fund(), daily.benchmark()) / benchmarkVariance;
    }

    private double alpha(double fundAnnReturn, double benchmarkAnnReturn, double beta) {
        double riskFreePercent = riskFreeRate * PERCENT;
        return fundAnnReturn - (riskFreePercent + beta * (benchmarkAnnReturn - riskFreePercent));
    }

    private double informationRatio(DailyReturns daily) {
        List<Double> excess = new ArrayList<>();
        for (int i = 0; i < daily.fund().size(); i++) {
            excess.add(daily.fund().get(i) - daily.benchmark().get(i));
        }
        double trackingError = Statistics.stdDev(excess);
        if (trackingError == 0) {
            return 0;
        }
        return (Statistics.mean(excess) * tradingDays) / (trackingError * Math.sqrt(tradingDays));
    }

    private double fundAgeYears(List<NavPoint> fundNav) {
        if (fundNav.isEmpty()) {
            return 0;
        }
        return Duration.between(fundNav.get(0).date(), clock.instant()).toDays() / DAYS_PER_YEAR;
    }

    private double consistencyScore(double cob, boolean sharpeWins, boolean rollingWins) {
        double score = cob * AnalyticsThresholds.COB_CONSISTENCY_WEIGHT
                + (sharpeWins ? AnalyticsThresholds.CONSISTENCY_WIN_BONUS : 0)
                + (rollingWins ? AnalyticsThresholds.CONSISTENCY_WIN_BONUS : 0);
        return Math.min(AnalyticsThresholds.MAX_CONSISTENCY_SCORE, score);
    }

    private double annualisedReturn(List<Double> dailyReturns) {
        return Statistics.mean(dailyReturns) * tradingDays;
    }

    private double annualisedVolatility(List<Double> dailyReturns) {
        return Statistics.stdDev(dailyReturns) * Math.sqrt(tradingDays);
    }

    private double sharpeRatio(List<Double> dailyReturns) {
        double annVol = annualisedVolatility(dailyReturns);
        if (annVol == 0) {
            return 0;
        }
        return (annualisedReturn(dailyReturns) - riskFreeRate) / annVol;
    }

    private double sortinoRatio(List<Double> dailyReturns) {
        List<Double> downside = dailyReturns.stream().filter(r -> r < 0).toList();
        double downsideDev = Statistics.stdDev(downside) * Math.sqrt(tradingDays);
        if (downsideDev == 0) {
            return 0;
        }
        return (annualisedReturn(dailyReturns) - riskFreeRate) / downsideDev;
    }

    private double treynorRatio(List<Double> dailyReturns, double beta) {
        return beta == 0 ? 0 : (annualisedReturn(dailyReturns) - riskFreeRate) / beta;
    }

    private double maxDrawdown(List<NavPoint> navSeries) {
        if (navSeries.isEmpty()) {
            return 0;
        }
        double peak = navSeries.get(0).nav();
        double maxDd = 0;
        for (NavPoint point : navSeries) {
            peak = Math.max(peak, point.nav());
            maxDd = Math.min(maxDd, point.nav() / peak - 1);
        }
        return maxDd * PERCENT;
    }

    private double totalReturn(List<NavPoint> navSeries) {
        if (navSeries.size() < 2) {
            return 0;
        }
        double first = navSeries.get(0).nav();
        double last = navSeries.get(navSeries.size() - 1).nav();
        return ((last / first) - 1) * PERCENT;
    }

    private record DailyReturns(List<Double> fund, List<Double> benchmark) {
    }
}
