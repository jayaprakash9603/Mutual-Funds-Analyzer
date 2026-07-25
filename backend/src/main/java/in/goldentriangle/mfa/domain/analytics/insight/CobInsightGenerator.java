package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.analytics.AnalyticsThresholds;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class CobInsightGenerator implements InsightGenerator {

    private static final String DEFAULT_CATEGORY = "mutual fund";

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        FundMetrics metrics = result.metrics();
        String category = result.category() == null || result.category().isBlank()
                ? DEFAULT_CATEGORY
                : result.category();
        if (metrics.cob() > AnalyticsThresholds.COB_PASS_PERCENT) {
            return Optional.of(String.format(
                    "Beat the benchmark in %.1f%% of rolling windows — strong consistency for a %s.",
                    metrics.cob(),
                    category));
        }
        if (metrics.cob() >= AnalyticsThresholds.COB_MODERATE_PERCENT) {
            return Optional.of(String.format(
                    "Chance of beating benchmark is %.1f%% — moderate consistency, below the %.0f%% Golden"
                            + " Triangle threshold.",
                    metrics.cob(),
                    AnalyticsThresholds.COB_PASS_PERCENT));
        }
        return Optional.of(String.format(
                "Only %.1f%% of rolling windows beat the benchmark — weak relative consistency.",
                metrics.cob()));
    }
}
