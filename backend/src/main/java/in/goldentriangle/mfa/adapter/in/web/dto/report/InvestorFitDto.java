package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record InvestorFitDto(List<String> suitableFor, List<String> notSuitableFor) {
}
