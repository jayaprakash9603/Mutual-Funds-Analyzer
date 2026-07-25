package in.goldentriangle.mfa.domain.analytics.rule;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.OverallRating;
import in.goldentriangle.mfa.domain.model.RuleResult;

import java.util.List;

public class RuleEngine {

    private final List<GoldenTriangleRule> rules;

    public RuleEngine(List<GoldenTriangleRule> rules) {
        this.rules = List.copyOf(rules);
    }

    public List<RuleResult> evaluate(FundMetrics metrics) {
        return rules.stream().map(rule -> rule.evaluate(metrics)).toList();
    }

    public int passCount(List<RuleResult> results) {
        return (int) results.stream().filter(RuleResult::passed).count();
    }

    public OverallRating overallRating(int passCount) {
        return OverallRating.fromPassCount(passCount);
    }
}
