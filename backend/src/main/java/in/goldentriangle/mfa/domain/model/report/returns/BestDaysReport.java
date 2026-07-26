package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record BestDaysReport(
        double initialInvestment,
        String periodLabel,
        List<MissingBestDaysScenario> missingScenarios,
        List<BestDayEntry> topBestDays,
        List<CrashPeriodBestDays> crashPeriods,
        List<TopDaysCumulative> topDaysCumulative,
        BestWorstProximityInsight proximityInsight,
        String headlineSummary) {

    public record MissingBestDaysScenario(
            int missCount,
            String label,
            double finalValue,
            double cagrPercent,
            double lowerByPercent) {
    }

    public record BestDayEntry(int rank, String date, double returnPercent) {
    }

    public record CrashPeriodBestDays(
            String periodLabel,
            String marketFallLabel,
            int topDaysInPeriod,
            int topRankLimit,
            List<BestDayInPeriod> bestDays) {
    }

    public record BestDayInPeriod(int rank, String date, double returnPercent) {
    }

    public record TopDaysCumulative(int topCount, double cumulativeReturnPercent) {
    }

    public record BestWorstProximityInsight(
            int bestDaysNearWorst,
            int worstDaysConsidered,
            int topRankLimit,
            String exampleText) {
    }
}
