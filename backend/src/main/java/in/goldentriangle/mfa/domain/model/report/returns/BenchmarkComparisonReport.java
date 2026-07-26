package in.goldentriangle.mfa.domain.model.report.returns;

public record BenchmarkComparisonReport(
        double fundTotalReturn,
        double benchmarkTotalReturn,
        double difference,
        boolean outperformed,
        double outperformancePercent,
        double winningPercent,
        String explanation) {
}
