package in.goldentriangle.mfa.domain.model;

public record SeriesStats(
        double avg,
        double max,
        double min,
        double stdDev,
        long count
) {
    public static SeriesStats empty() {
        return new SeriesStats(0, 0, 0, 0, 0);
    }
}
