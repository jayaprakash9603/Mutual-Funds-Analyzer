package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record BestDaysReportDto(
        double initialInvestment,
        String periodLabel,
        List<MissingBestDaysScenarioDto> missingScenarios,
        List<BestDayEntryDto> topBestDays,
        List<CrashPeriodBestDaysDto> crashPeriods,
        List<TopDaysCumulativeDto> topDaysCumulative,
        BestWorstProximityInsightDto proximityInsight,
        String headlineSummary) {

    public record MissingBestDaysScenarioDto(
            int missCount,
            String label,
            double finalValue,
            double cagrPercent,
            double lowerByPercent) {
    }

    public record BestDayEntryDto(int rank, String date, double returnPercent) {
    }

    public record CrashPeriodBestDaysDto(
            String periodLabel,
            String marketFallLabel,
            int topDaysInPeriod,
            int topRankLimit,
            List<BestDayInPeriodDto> bestDays) {
    }

    public record BestDayInPeriodDto(int rank, String date, double returnPercent) {
    }

    public record TopDaysCumulativeDto(int topCount, double cumulativeReturnPercent) {
    }

    public record BestWorstProximityInsightDto(
            int bestDaysNearWorst,
            int worstDaysConsidered,
            int topRankLimit,
            String exampleText) {
    }
}
