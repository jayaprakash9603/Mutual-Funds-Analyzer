package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.analytics.AnalyticsThresholds;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class SharpeInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        FundMetrics metrics = result.metrics();
        double sharpeDiff = metrics.fundSharpe() - metrics.benchmarkSharpe();
        if (sharpeDiff > AnalyticsThresholds.SHARPE_SUPERIOR_DIFF) {
            return Optional.of(String.format(
                    "Risk-adjusted returns are superior: Sharpe %.2f vs benchmark %.2f, Sortino %.2f.",
                    metrics.fundSharpe(),
                    metrics.benchmarkSharpe(),
                    metrics.sortino()));
        }
        if (sharpeDiff > AnalyticsThresholds.SHARPE_PARITY_DIFF) {
            return Optional.of(String.format(
                    "Sharpe ratio is near parity (%.2f vs %.2f) — similar risk-adjusted efficiency.",
                    metrics.fundSharpe(),
                    metrics.benchmarkSharpe()));
        }
        return Optional.of(String.format(
                "Weaker risk-adjusted returns: Sharpe %.2f vs benchmark %.2f.",
                metrics.fundSharpe(),
                metrics.benchmarkSharpe()));
    }
}
