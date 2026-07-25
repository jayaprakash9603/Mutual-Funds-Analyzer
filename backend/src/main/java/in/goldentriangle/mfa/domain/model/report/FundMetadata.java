package in.goldentriangle.mfa.domain.model.report;

public record FundMetadata(
        String fundManager,
        double expenseRatio,
        String exitLoad,
        String minimumInvestment,
        String aum,
        String riskometer,
        String sebiRiskCategory,
        String planType,
        String optionType,
        String launchDate) {
}
