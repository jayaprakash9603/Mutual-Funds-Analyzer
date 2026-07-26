package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record AllTimeHighsReport(
        String periodLabel,
        List<NavPoint> series,
        List<YearlyMaxNav> yearlyMaxLevels,
        AllTimeHighsSummary summary) {

    public record NavPoint(String date, double nav, boolean allTimeHigh) {
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
}
