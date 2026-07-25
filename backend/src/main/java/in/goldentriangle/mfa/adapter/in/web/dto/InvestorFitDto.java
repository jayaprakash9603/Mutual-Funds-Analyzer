package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record InvestorFitDto(List<String> suitableFor, List<String> notSuitableFor) {
}
