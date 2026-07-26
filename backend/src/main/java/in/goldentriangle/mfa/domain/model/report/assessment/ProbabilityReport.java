package in.goldentriangle.mfa.domain.model.report.assessment;

public record ProbabilityReport(
        double positiveReturn,
        double beatInflation,
        double beatBenchmark,
        double above10Cagr,
        double doubleMoney,
        double tripleMoney) {
}
