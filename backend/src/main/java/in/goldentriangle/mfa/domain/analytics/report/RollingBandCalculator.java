package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import in.goldentriangle.mfa.domain.model.AlignedRollingPoint;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.RollingReturnsReport;

import java.util.ArrayList;
import java.util.List;

public class RollingBandCalculator {

    private static final List<String> PERIOD_LABELS = List.of(
            "15 Year", "12 Year", "10 Year", "7 Year", "5 Year", "3 Year", "1 Year");

    public RollingReturnsReport compute(RollingReturnsData data, double consistencyScore) {
        List<RollingReturnsReport.PeriodRollingStats> periods = new ArrayList<>();
        for (String label : PERIOD_LABELS) {
            List<RollingReturnRow> fundRows = filterByPeriod(data.fund(), label);
            if (fundRows.isEmpty()) {
                continue;
            }
            List<Double> returns = fundRows.stream()
                    .map(RollingReturnRow::schemeRollingReturns)
                    .toList();
            periods.add(buildStats(label, returns));
        }
        return new RollingReturnsReport(periods, consistencyScore);
    }

    public RollingReturnsReport.PeriodRollingStats buildStats(String label, List<Double> returns) {
        if (returns.isEmpty()) {
            return new RollingReturnsReport.PeriodRollingStats(label, 0, 0, 0, 0, 0, 0, 0);
        }
        double avg = Statistics.mean(returns);
        double max = returns.stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double min = returns.stream().mapToDouble(Double::doubleValue).min().orElse(0);
        double median = Statistics.median(returns);
        int count = returns.size();
        double above10 = percentAbove(returns, 10);
        double above7 = percentAbove(returns, 7);
        double negative = percentBelow(returns, 0);
        return new RollingReturnsReport.PeriodRollingStats(
                label, avg, max, min, median, above10, above7, negative);
    }

    public static double percentAbove(List<Double> values, double threshold) {
        if (values.isEmpty()) {
            return 0;
        }
        long count = values.stream().filter(v -> v >= threshold).count();
        return count * 100.0 / values.size();
    }

    public static double percentBelow(List<Double> values, double threshold) {
        if (values.isEmpty()) {
            return 0;
        }
        long count = values.stream().filter(v -> v < threshold).count();
        return count * 100.0 / values.size();
    }

    private List<RollingReturnRow> filterByPeriod(List<RollingReturnRow> rows, String period) {
        return rows.stream().filter(row -> period.equals(row.period())).toList();
    }

    public double winningPercent(RollingReturnsData data) {
        List<AlignedRollingPoint> aligned = NavSeriesBuilder.alignRollingReturns(data.fund(), data.benchmark());
        if (aligned.isEmpty()) {
            return 0;
        }
        long wins = aligned.stream().filter(p -> p.fundReturn() > p.benchmarkReturn()).count();
        return wins * 100.0 / aligned.size();
    }
}
