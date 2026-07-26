package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.analytics.insight.InsightComposer;
import in.goldentriangle.mfa.domain.analytics.rule.RuleEngine;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.OverallRating;
import in.goldentriangle.mfa.domain.model.RuleResult;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.TimelineEvent;

import java.util.List;

public class GoldenTriangleEvaluator {

    private final MetricsCalculator metricsCalculator;
    private final RuleEngine ruleEngine;
    private final InsightComposer insightComposer;
    private final TimelineBuilder timelineBuilder;

    public GoldenTriangleEvaluator(
            MetricsCalculator metricsCalculator,
            RuleEngine ruleEngine,
            InsightComposer insightComposer,
            TimelineBuilder timelineBuilder) {
        this.metricsCalculator = metricsCalculator;
        this.ruleEngine = ruleEngine;
        this.insightComposer = insightComposer;
        this.timelineBuilder = timelineBuilder;
    }

    public GoldenTriangleResult evaluate(AnalysisInput input) {
        FundMetrics metrics = metricsCalculator.compute(input);
        List<RuleResult> rules = ruleEngine.evaluate(metrics);
        int passCount = ruleEngine.passCount(rules);
        OverallRating overallRating = ruleEngine.overallRating(passCount);

        List<RollingReturnRow> fund = input.fund();
        List<RollingReturnRow> benchmark = input.benchmark();

        return new GoldenTriangleResult(
                rules,
                passCount,
                overallRating,
                passCount == rules.size(),
                metrics,
                fund.isEmpty() ? "Unknown Fund" : fund.get(0).schemeName(),
                benchmark.isEmpty() ? "Unknown Benchmark" : benchmark.get(0).schemeName(),
                fund.isEmpty() ? "" : nullSafe(fund.get(0).schemeCategory()),
                input.period());
    }

    public List<String> generateInsights(GoldenTriangleResult result) {
        return insightComposer.compose(result);
    }

    public List<TimelineEvent> buildTimeline(GoldenTriangleResult result, List<RollingReturnRow> fund) {
        return timelineBuilder.build(result, fund);
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
