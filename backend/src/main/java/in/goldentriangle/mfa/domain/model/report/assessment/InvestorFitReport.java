package in.goldentriangle.mfa.domain.model.report.assessment;

import java.util.List;

public record InvestorFitReport(List<String> suitableFor, List<String> notSuitableFor) {
}
