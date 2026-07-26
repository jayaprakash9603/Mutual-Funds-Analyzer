package in.goldentriangle.mfa.adapter.in.web.dto.report;

public record ProbabilityDto(
        double positiveReturn,
        double beatInflation,
        double beatBenchmark,
        double above10Cagr,
        double doubleMoney,
        double tripleMoney) {
}
