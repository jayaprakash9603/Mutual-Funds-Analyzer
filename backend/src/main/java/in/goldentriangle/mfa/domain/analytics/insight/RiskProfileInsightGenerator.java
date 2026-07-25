package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.analytics.AnalyticsThresholds;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class RiskProfileInsightGenerator implements InsightGenerator {

    private static final double PERCENT = 100;

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        return Optional.of(riskProfileSentence(result.metrics()));
    }

    static String riskProfileSentence(FundMetrics metrics) {
        double volRatio = metrics.benchmarkVolatility() > 0
                ? metrics.fundVolatility() / metrics.benchmarkVolatility()
                : 1;
        if (metrics.beta() < AnalyticsThresholds.DEFENSIVE_BETA
                && volRatio < AnalyticsThresholds.DEFENSIVE_VOL_RATIO) {
            return String.format(
                    "Defensive profile: beta %.2f with %.0f%% lower volatility than the benchmark.",
                    metrics.beta(),
                    (1 - volRatio) * PERCENT);
        }
        if (metrics.beta() > AnalyticsThresholds.AGGRESSIVE_BETA
                || volRatio > AnalyticsThresholds.AGGRESSIVE_VOL_RATIO) {
            return String.format(
                    "Aggressive profile: beta %.2f with %.1f%% annualised volatility vs benchmark %.1f%%.",
                    metrics.beta(),
                    metrics.fundVolatility(),
                    metrics.benchmarkVolatility());
        }
        return String.format(
                "Benchmark-like risk shape: beta %.2f, volatility within %.0f%% of the index.",
                metrics.beta(),
                Math.abs((volRatio - 1) * PERCENT));
    }
}
