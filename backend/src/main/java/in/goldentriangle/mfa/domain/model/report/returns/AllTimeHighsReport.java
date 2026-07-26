package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record AllTimeHighsReport(
        String periodLabel,
        List<NavPoint> series,
        List<YearlyMaxNav> yearlyMaxLevels,
        AllTimeHighsSummary summary,
        PostAthReturns postAthReturns,
        AthDeclineOutlook athDeclineOutlook) {

    public record NavPoint(String date, double nav, boolean allTimeHigh, Boolean fellBelowThreshold) {
    }

    public record YearlyMaxNav(int year, String yearLabel, double maxNav, boolean allTimeHighYear) {
    }

    public record AllTimeHighsSummary(
            int totalAllTimeHighDays,
            int calendarYears,
            int yearsWithNewHigh,
            double yearsWithNewHighPercent,
            String headline) {
    }

    public record PostAthReturns(List<PostAthHorizon> horizons, String headline) {
    }

    public record PostAthHorizon(
            String label,
            int years,
            int sampleCount,
            double averageCagrPercent,
            List<PostAthThreshold> thresholds) {
    }

    public record PostAthThreshold(
            String label, double boundPercent, boolean above, double shareOfTimesPercent) {
    }

    public record AthDeclineOutlook(
            double declineThresholdPercent,
            int totalAthInstances,
            int neverFellCount,
            double neverFellPercent,
            int fellCount,
            double fellPercent,
            String headline) {
    }
}
