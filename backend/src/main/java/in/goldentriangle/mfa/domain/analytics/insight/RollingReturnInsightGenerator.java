package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.analytics.AnalyticsThresholds;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class RollingReturnInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        FundMetrics metrics = result.metrics();
        double rrDiff = metrics.fundRollingAvg() - metrics.benchmarkRollingAvg();
        String word = magnitudeWord(rrDiff);
        if (rrDiff >= 0) {
            return Optional.of(String.format(
                    "%s %s outperforms its benchmark on rolling returns by %.2f%% (%.2f%% vs %.2f%%).",
                    result.fundName(),
                    word,
                    rrDiff,
                    metrics.fundRollingAvg(),
                    metrics.benchmarkRollingAvg()));
        }
        return Optional.of(String.format(
                "%s underperforms its benchmark on rolling returns by %.2f%% (%.2f%% vs %.2f%%).",
                result.fundName(),
                Math.abs(rrDiff),
                metrics.fundRollingAvg(),
                metrics.benchmarkRollingAvg()));
    }

    static String magnitudeWord(double diff) {
        double abs = Math.abs(diff);
        if (abs < AnalyticsThresholds.MARGINAL_RETURN_DIFF_PERCENT) return "marginally";
        if (abs < AnalyticsThresholds.CONSISTENT_RETURN_DIFF_PERCENT) return "consistently";
        return "decisively";
    }
}
