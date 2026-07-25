package in.goldentriangle.mfa.domain.model;

import java.util.List;

public record GoldenTriangleResult(
        List<RuleResult> rules,
        int passCount,
        OverallRating overallRating,
        boolean passed,
        FundMetrics metrics,
        String fundName,
        String benchmarkName,
        String category,
        String period
) {
}
