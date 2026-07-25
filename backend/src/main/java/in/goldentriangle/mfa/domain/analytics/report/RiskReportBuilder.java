package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.DrawdownReport;
import in.goldentriangle.mfa.domain.model.report.RiskReport;

import java.util.ArrayList;
import java.util.List;

public class RiskReportBuilder {

    private final MetricsCalculator metricsCalculator;
    private final DrawdownCalculator drawdownCalculator;
    private final int tradingDays;

    public RiskReportBuilder(MetricsCalculator metricsCalculator, DrawdownCalculator drawdownCalculator, int tradingDays) {
        this.metricsCalculator = metricsCalculator;
        this.drawdownCalculator = drawdownCalculator;
        this.tradingDays = tradingDays;
    }

    public RiskReport build(RollingReturnsData data, String periodLabel) {
        AnalysisInput input = new AnalysisInput(data.fund(), data.benchmark(), periodLabel);
        FundMetrics metrics = metricsCalculator.compute(input);

        List<NavPoint> fundNav = NavSeriesBuilder.buildNavSeries(data.fund());
        List<NavPoint> benchNav = NavSeriesBuilder.buildNavSeries(data.benchmark());
        var common = NavSeriesBuilder.getCommonNavSeries(fundNav, benchNav);

        List<Double> fundDaily = NavSeriesBuilder.computeDailyReturns(
                common.stream().map(p -> new NavPoint(p.date(), p.fundNav())).toList());
        List<Double> benchDaily = NavSeriesBuilder.computeDailyReturns(
                common.stream().map(p -> new NavPoint(p.date(), p.benchmarkNav())).toList());

        int minLen = Math.min(fundDaily.size(), benchDaily.size());
        double rSquared = rSquared(fundDaily.subList(0, minLen), benchDaily.subList(0, minLen));
        double trackingError = trackingError(fundDaily.subList(0, minLen), benchDaily.subList(0, minLen));
        double ulcer = ulcerIndex(fundNav);
        DrawdownReport dd = drawdownCalculator.compute(fundNav);
        double calmar = dd.biggestCrash() == 0 ? 0 : metrics.fundAnnReturn() / dd.biggestCrash();
        double var95 = valueAtRisk(fundDaily, 0.05);
        Capture capture = captureRatios(fundDaily.subList(0, minLen), benchDaily.subList(0, minLen));

        return new RiskReport(
                metrics.fundVolatility(),
                metrics.fundVolatility(),
                metrics.fundSharpe(),
                metrics.sortino(),
                metrics.treynor(),
                metrics.beta(),
                metrics.alpha(),
                rSquared,
                metrics.maxDrawdown(),
                dd.recoveryTimeYears(),
                capture.downside(),
                capture.upside(),
                metrics.informationRatio(),
                trackingError,
                ulcer,
                calmar,
                var95,
                metrics.riskLevel());
    }

    private double rSquared(List<Double> fund, List<Double> bench) {
        if (fund.isEmpty()) {
            return 0;
        }
        double meanFund = Statistics.mean(fund);
        double meanBench = Statistics.mean(bench);
        double cov = 0;
        double varBench = 0;
        for (int i = 0; i < fund.size(); i++) {
            cov += (fund.get(i) - meanFund) * (bench.get(i) - meanBench);
            varBench += Math.pow(bench.get(i) - meanBench, 2);
        }
        return varBench == 0 ? 0 : Math.pow(cov / varBench, 2);
    }

    private double trackingError(List<Double> fund, List<Double> bench) {
        if (fund.isEmpty()) {
            return 0;
        }
        List<Double> excess = new ArrayList<>();
        for (int i = 0; i < fund.size(); i++) {
            excess.add(fund.get(i) - bench.get(i));
        }
        return CalendarMath.annualiseDailyVolatility(Statistics.stdDev(excess), tradingDays) * 100;
    }

    private double ulcerIndex(List<NavPoint> nav) {
        if (nav.isEmpty()) {
            return 0;
        }
        double peak = nav.get(0).nav();
        double sumSq = 0;
        int count = 0;
        for (NavPoint point : nav) {
            peak = Math.max(peak, point.nav());
            double dd = peak <= 0 ? 0 : ((point.nav() / peak) - 1) * 100;
            sumSq += dd * dd;
            count++;
        }
        return count == 0 ? 0 : Math.sqrt(sumSq / count);
    }

    private double valueAtRisk(List<Double> dailyReturns, double percentile) {
        if (dailyReturns.isEmpty()) {
            return 0;
        }
        List<Double> sorted = dailyReturns.stream().sorted().toList();
        int index = (int) Math.floor(percentile * sorted.size());
        index = Math.max(0, Math.min(index, sorted.size() - 1));
        return sorted.get(index) * 100;
    }

    private Capture captureRatios(List<Double> fund, List<Double> bench) {
        double downFund = 0;
        double downBench = 0;
        double upFund = 0;
        double upBench = 0;
        for (int i = 0; i < fund.size(); i++) {
            if (bench.get(i) < 0) {
                downFund += fund.get(i);
                downBench += bench.get(i);
            } else if (bench.get(i) > 0) {
                upFund += fund.get(i);
                upBench += bench.get(i);
            }
        }
        return new Capture(
                downBench == 0 ? 0 : (downFund / downBench) * 100,
                upBench == 0 ? 0 : (upFund / upBench) * 100);
    }

    private record Capture(double downside, double upside) {
    }
}
