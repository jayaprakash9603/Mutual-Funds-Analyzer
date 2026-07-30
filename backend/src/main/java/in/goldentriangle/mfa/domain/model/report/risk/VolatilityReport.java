package in.goldentriangle.mfa.domain.model.report.risk;

import java.util.List;

public record VolatilityReport(
        String periodLabel,
        boolean benchmarkAvailable,
        List<PeriodVolatility> periods,
        List<RollingVolatilityPoint> rollingSeries,
        RollingVolatilitySummary rollingSummary,
        List<ReturnBucket> dailyDistribution,
        String volatilityBand,
        String headline) {

    public record PeriodVolatility(
            String frequency,
            int observations,
            double stdDevPercent,
            double annualisedVolatilityPercent,
            double averageReturnPercent,
            double typicalSwingPercent,
            double bestReturnPercent,
            String bestReturnDate,
            double worstReturnPercent,
            String worstReturnDate,
            double positivePeriodsPercent,
            double negativePeriodsPercent,
            double benchmarkAnnualisedVolatilityPercent,
            double benchmarkBestReturnPercent,
            double benchmarkWorstReturnPercent) {
    }

    public record RollingVolatilityPoint(
            String date,
            double fundVolatilityPercent,
            double benchmarkVolatilityPercent) {
    }

    public record RollingVolatilitySummary(
            int windowDays,
            double currentPercent,
            double averagePercent,
            double maxPercent,
            String maxDate,
            double minPercent,
            String minDate,
            double benchmarkAveragePercent,
            double timeAboveBenchmarkPercent) {
    }

    public record ReturnBucket(
            String label,
            double lowerPercent,
            double upperPercent,
            int count,
            double sharePercent) {
    }
}
