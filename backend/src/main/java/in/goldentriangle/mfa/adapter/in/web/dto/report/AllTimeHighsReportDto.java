package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record AllTimeHighsReportDto(
        String periodLabel,
        List<NavPointDto> series,
        List<YearlyMaxNavDto> yearlyMaxLevels,
        AllTimeHighsSummaryDto summary,
        PostAthReturnsDto postAthReturns,
        AthDeclineOutlookDto athDeclineOutlook) {

    public record NavPointDto(String date, double nav, boolean allTimeHigh, Boolean fellBelowThreshold) {
    }

    public record YearlyMaxNavDto(int year, String yearLabel, double maxNav, boolean allTimeHighYear) {
    }

    public record AllTimeHighsSummaryDto(
            int totalAllTimeHighDays,
            int calendarYears,
            int yearsWithNewHigh,
            double yearsWithNewHighPercent,
            String headline) {
    }

    public record PostAthReturnsDto(List<PostAthHorizonDto> horizons, String headline) {
    }

    public record PostAthHorizonDto(
            String label,
            int years,
            int sampleCount,
            double averageCagrPercent,
            List<PostAthThresholdDto> thresholds) {
    }

    public record PostAthThresholdDto(
            String label, double boundPercent, boolean above, double shareOfTimesPercent) {
    }

    public record AthDeclineOutlookDto(
            double declineThresholdPercent,
            int totalAthInstances,
            int neverFellCount,
            double neverFellPercent,
            int fellCount,
            double fellPercent,
            String headline) {
    }
}
