package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record RollingReturnsResponseDto(
        List<RollingReturnRowDto> fund,
        List<RollingReturnRowDto> benchmark
) {
}
