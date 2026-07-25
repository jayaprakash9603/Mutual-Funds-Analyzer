package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.Map;

public record FeatureFlagsResponseDto(Map<String, Boolean> flags) {
}
