package in.goldentriangle.mfa.adapter.in.web.dto;

public record SeriesStatsDto(
        double avg,
        double max,
        double min,
        double stdDev,
        long count
) {
}
