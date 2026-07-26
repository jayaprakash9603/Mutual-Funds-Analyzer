package in.goldentriangle.mfa.adapter.in.web.dto.compare;

import in.goldentriangle.mfa.adapter.in.web.dto.common.GoldenTriangleResultDto;
import java.util.List;

public record CompareResponseDto(List<GoldenTriangleResultDto> results) {
}
