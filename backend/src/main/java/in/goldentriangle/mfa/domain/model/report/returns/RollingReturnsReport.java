package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record RollingReturnsReport(
        List<PeriodRollingStats> periods,
        double consistencyScore) {

    public record PeriodRollingStats(
            String periodLabel,
            double average,
            double maximum,
            double minimum,
            double median,
            double stdDev,
            int count,
            double percentAbove10,
            double percentAbove7,
            double percentNegative) {
    }
}
