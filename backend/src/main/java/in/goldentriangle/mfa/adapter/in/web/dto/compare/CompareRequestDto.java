package in.goldentriangle.mfa.adapter.in.web.dto.compare;

import in.goldentriangle.mfa.domain.model.Period;
import java.util.List;

public record CompareRequestDto(List<String> schemes, String period) {
}
