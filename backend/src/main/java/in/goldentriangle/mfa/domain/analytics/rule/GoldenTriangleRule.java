package in.goldentriangle.mfa.domain.analytics.rule;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.RuleId;
import in.goldentriangle.mfa.domain.model.RuleResult;

public interface GoldenTriangleRule {
    RuleId id();

    RuleResult evaluate(FundMetrics metrics);
}
