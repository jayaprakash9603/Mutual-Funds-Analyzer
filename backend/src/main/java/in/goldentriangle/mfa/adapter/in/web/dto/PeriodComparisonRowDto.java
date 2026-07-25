package in.goldentriangle.mfa.adapter.in.web.dto;

public record PeriodComparisonRowDto(
        String period,
        String fundName,
        String benchmarkName,
        SeriesStatsDto fund,
        SeriesStatsDto benchmark,
        double cob,
        long totalRecords
) {
}
