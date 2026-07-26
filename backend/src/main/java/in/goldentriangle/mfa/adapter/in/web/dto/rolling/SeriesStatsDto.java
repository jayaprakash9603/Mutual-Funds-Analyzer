package in.goldentriangle.mfa.adapter.in.web.dto.rolling;

public record SeriesStatsDto(
        double avg,
        double max,
        double min,
        double stdDev,
        long count
) {
}
