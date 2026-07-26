package in.goldentriangle.mfa.adapter.in.web.dto.common;

import java.util.Map;

public record FeatureFlagsResponseDto(Map<String, Boolean> flags) {
}
