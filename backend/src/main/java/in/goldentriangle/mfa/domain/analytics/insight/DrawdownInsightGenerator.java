package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.analytics.AnalyticsThresholds;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class DrawdownInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        FundMetrics metrics = result.metrics();
        double ddDiff = metrics.maxDrawdown() - metrics.benchmarkMaxDrawdown();
        if (ddDiff < -AnalyticsThresholds.DRAWDOWN_MATERIAL_DIFF_PERCENT) {
            return Optional.of(String.format(
                    "Drawdown protection: max drawdown %.2f%% vs benchmark %.2f%% — shallower losses in downturns.",
                    metrics.maxDrawdown(),
                    metrics.benchmarkMaxDrawdown()));
        }
        if (ddDiff > AnalyticsThresholds.DRAWDOWN_MATERIAL_DIFF_PERCENT) {
            return Optional.of(String.format(
                    "Higher drawdown risk: fund max drawdown %.2f%% vs benchmark %.2f%%.",
                    metrics.maxDrawdown(),
                    metrics.benchmarkMaxDrawdown()));
        }
        return Optional.of(String.format(
                "Drawdown profile is similar to benchmark (%.2f%% vs %.2f%%).",
                metrics.maxDrawdown(),
                metrics.benchmarkMaxDrawdown()));
    }
}
