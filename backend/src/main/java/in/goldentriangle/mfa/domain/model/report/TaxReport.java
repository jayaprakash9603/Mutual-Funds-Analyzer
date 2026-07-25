package in.goldentriangle.mfa.domain.model.report;

public record TaxReport(
        double stcg,
        double ltcg,
        double indexationBenefit,
        double postTaxReturn,
        String explanation) {
}
