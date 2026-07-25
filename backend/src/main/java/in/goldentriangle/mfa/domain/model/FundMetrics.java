package in.goldentriangle.mfa.domain.model;

public record FundMetrics(
        double fundRollingAvg,
        double benchmarkRollingAvg,
        double fundRollingMax,
        double fundRollingMin,
        double benchmarkRollingMax,
        double benchmarkRollingMin,
        double cob,
        double fundSharpe,
        double benchmarkSharpe,
        double fundAnnReturn,
        double benchmarkAnnReturn,
        double fundVolatility,
        double benchmarkVolatility,
        double alpha,
        double beta,
        double sortino,
        double treynor,
        double informationRatio,
        double maxDrawdown,
        double benchmarkMaxDrawdown,
        double totalReturn,
        double benchmarkTotalReturn,
        String riskLevel,
        double fundAgeYears,
        double consistencyScore
) {
}
