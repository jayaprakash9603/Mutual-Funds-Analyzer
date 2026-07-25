package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record InvestorFitReport(List<String> suitableFor, List<String> notSuitableFor) {
}
