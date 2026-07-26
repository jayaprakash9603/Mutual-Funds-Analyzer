package in.goldentriangle.mfa.adapter.in.web.dto.report;

public record BenchmarkComparisonDto(
        double fundTotalReturn,
        double benchmarkTotalReturn,
        double difference,
        boolean outperformed,
        double outperformancePercent,
        double winningPercent,
        String explanation) {
}
