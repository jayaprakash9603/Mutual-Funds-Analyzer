package in.goldentriangle.mfa.domain.model.report.investment;

public record TaxReport(
        double stcg,
        double ltcg,
        double indexationBenefit,
        double postTaxReturn,
        String explanation) {
}
