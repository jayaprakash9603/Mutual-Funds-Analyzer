package in.goldentriangle.mfa.adapter.in.web.dto.common;

import in.goldentriangle.mfa.adapter.in.web.dto.report.FundMetricsDto;
import in.goldentriangle.mfa.domain.model.OverallRating;
import in.goldentriangle.mfa.domain.model.Period;
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
