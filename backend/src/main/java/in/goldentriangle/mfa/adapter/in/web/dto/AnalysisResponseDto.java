package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record AnalysisResponseDto(
        GoldenTriangleResultDto result,
        List<String> insights,
        List<TimelineEventDto> timeline,
        RollingReturnsResponseDto data
) {
}
