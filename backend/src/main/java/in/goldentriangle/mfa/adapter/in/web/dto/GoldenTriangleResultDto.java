package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record GoldenTriangleResultDto(
        List<RuleResultDto> rules,
        int passCount,
        String overallRating,
        boolean passed,
        FundMetricsDto metrics,
        String fundName,
        String benchmarkName,
        String category,
        String period
) {
}
