package in.goldentriangle.mfa.domain.analytics.rule;

import in.goldentriangle.mfa.domain.analytics.AnalyticsThresholds;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.RuleId;
import in.goldentriangle.mfa.domain.model.RuleResult;

public class CobRule implements GoldenTriangleRule {

    @Override
    public RuleId id() {
        return RuleId.COB;
    }

    @Override
    public RuleResult evaluate(FundMetrics metrics) {
        return new RuleResult(
                RuleId.COB,
                "Chance of Beating Benchmark",
                metrics.cob() > AnalyticsThresholds.COB_PASS_PERCENT,
                metrics.cob(),
                AnalyticsThresholds.COB_PASS_PERCENT,
                String.format("COB must be greater than %.0f%%", AnalyticsThresholds.COB_PASS_PERCENT));
    }
}
