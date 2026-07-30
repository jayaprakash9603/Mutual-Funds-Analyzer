package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record VolatilityReportDto(
        String periodLabel,
        boolean benchmarkAvailable,
        List<PeriodVolatilityDto> periods,
        List<RollingVolatilityPointDto> rollingSeries,
        RollingVolatilitySummaryDto rollingSummary,
        List<ReturnBucketDto> dailyDistribution,
        String volatilityBand,
        String headline) {

    public record PeriodVolatilityDto(
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

    public record RollingVolatilityPointDto(
            String date,
            double fundVolatilityPercent,
            double benchmarkVolatilityPercent) {
    }

    public record RollingVolatilitySummaryDto(
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

    public record ReturnBucketDto(
            String label,
            double lowerPercent,
            double upperPercent,
            int count,
            double sharePercent) {
    }
}
