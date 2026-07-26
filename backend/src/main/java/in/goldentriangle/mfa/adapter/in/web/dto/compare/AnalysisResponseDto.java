package in.goldentriangle.mfa.adapter.in.web.dto.compare;

import in.goldentriangle.mfa.adapter.in.web.dto.common.GoldenTriangleResultDto;
import in.goldentriangle.mfa.adapter.in.web.dto.common.TimelineEventDto;
import in.goldentriangle.mfa.adapter.in.web.dto.rolling.RollingReturnsResponseDto;
import java.util.List;

public record AnalysisResponseDto(
        GoldenTriangleResultDto result,
        List<String> insights,
        List<TimelineEventDto> timeline,
        RollingReturnsResponseDto data
) {
}
