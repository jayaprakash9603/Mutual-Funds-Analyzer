package in.goldentriangle.mfa.adapter.in.web.dto.report;

public record TaxReportDto(
        double stcg,
        double ltcg,
        double indexationBenefit,
        double postTaxReturn,
        String explanation) {
}
