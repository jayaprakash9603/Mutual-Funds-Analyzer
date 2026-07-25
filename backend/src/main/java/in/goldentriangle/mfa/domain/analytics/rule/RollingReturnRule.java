package in.goldentriangle.mfa.domain.analytics.rule;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.RuleId;
import in.goldentriangle.mfa.domain.model.RuleResult;

public class RollingReturnRule implements GoldenTriangleRule {

    @Override
    public RuleId id() {
        return RuleId.ROLLING_RETURN;
    }

    @Override
    public RuleResult evaluate(FundMetrics metrics) {
        return new RuleResult(
                RuleId.ROLLING_RETURN,
                "Rolling Return",
                metrics.fundRollingAvg() > metrics.benchmarkRollingAvg(),
                metrics.fundRollingAvg(),
                metrics.benchmarkRollingAvg(),
                "Fund 5-Year Rolling Return Average must exceed Benchmark Average");
    }
}
