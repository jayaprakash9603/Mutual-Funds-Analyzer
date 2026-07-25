package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record CompareRequestDto(List<String> schemes, String period) {
}
