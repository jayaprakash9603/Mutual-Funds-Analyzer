package in.goldentriangle.mfa.domain.model;

public record PeriodComparisonRow(
        String period,
        String fundName,
        String benchmarkName,
        SeriesStats fund,
        SeriesStats benchmark,
        double cob,
        long totalRecords
) {
}
