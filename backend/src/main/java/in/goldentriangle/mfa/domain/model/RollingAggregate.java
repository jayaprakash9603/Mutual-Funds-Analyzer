package in.goldentriangle.mfa.domain.model;

import java.time.Instant;

public record RollingAggregate(
        String scheme,
        Period period,
        String fundName,
        String benchmarkName,
        String category,
        WelfordAccumulator fundStats,
        WelfordAccumulator indexStats,
        long alignedCount,
        long fundWinCount,
        Instant watermarkNavDate,
        Instant computedAt,
        long version
) {
    private static final double PERCENT = 100.0;

    public static RollingAggregate empty(String scheme, Period period) {
        return new RollingAggregate(
                scheme,
                period,
                "",
                "",
                "",
                WelfordAccumulator.empty(),
                WelfordAccumulator.empty(),
                0,
                0,
                null,
                Instant.EPOCH,
                0);
    }

    public double cob() {
        return alignedCount == 0 ? 0 : fundWinCount * PERCENT / alignedCount;
    }

    public SeriesStats fundSeriesStats() {
        return fundStats.toStats();
    }

    public SeriesStats indexSeriesStats() {
        return indexStats.toStats();
    }

    public PeriodComparisonRow toComparisonRow() {
        return new PeriodComparisonRow(
                period.label(),
                fundName,
                benchmarkName,
                fundSeriesStats(),
                indexSeriesStats(),
                cob(),
                alignedCount);
    }

    public RollingAggregate withComputedAt(Instant computedAt) {
        return new RollingAggregate(
                scheme, period, fundName, benchmarkName, category,
                fundStats, indexStats, alignedCount, fundWinCount,
                watermarkNavDate, computedAt, version);
    }
}
