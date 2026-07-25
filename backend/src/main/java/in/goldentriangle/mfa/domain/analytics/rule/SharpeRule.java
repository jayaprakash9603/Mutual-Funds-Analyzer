package in.goldentriangle.mfa.domain.analytics.rule;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.RuleId;
import in.goldentriangle.mfa.domain.model.RuleResult;

public class SharpeRule implements GoldenTriangleRule {

    @Override
    public RuleId id() {
        return RuleId.SHARPE;
    }

    @Override
    public RuleResult evaluate(FundMetrics metrics) {
        return new RuleResult(
                RuleId.SHARPE,
                "Sharpe Ratio",
                metrics.fundSharpe() > metrics.benchmarkSharpe(),
                metrics.fundSharpe(),
                metrics.benchmarkSharpe(),
                "Fund Sharpe Ratio must exceed Benchmark Sharpe Ratio");
    }
}
