package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class ConsistencyInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        FundMetrics metrics = result.metrics();
        double spread = metrics.fundRollingMax() - metrics.fundRollingMin();
        return Optional.of(String.format(
                "Rolling return range spans %.2f%% to %.2f%% (%.2f pp spread) — consistency score %.0f.",
                metrics.fundRollingMin(),
                metrics.fundRollingMax(),
                spread,
                metrics.consistencyScore()));
    }
}
