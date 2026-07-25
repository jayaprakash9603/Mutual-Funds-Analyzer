package in.goldentriangle.mfa.adapter.in.web.dto;

public record RiskReportDto(
        double volatility,
        double standardDeviation,
        double sharpeRatio,
        double sortinoRatio,
        double treynorRatio,
        double beta,
        double alpha,
        double rSquared,
        double maxDrawdown,
        double recoveryTimeYears,
        double downsideCapture,
        double upsideCapture,
        double informationRatio,
        double trackingError,
        double ulcerIndex,
        double calmarRatio,
        double valueAtRisk95,
        String riskLevel) {
}
