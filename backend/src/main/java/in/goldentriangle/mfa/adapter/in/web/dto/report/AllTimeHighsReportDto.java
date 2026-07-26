package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record AllTimeHighsReportDto(
        String periodLabel,
        List<NavPointDto> series,
        List<YearlyMaxNavDto> yearlyMaxLevels,
        AllTimeHighsSummaryDto summary) {

    public record NavPointDto(String date, double nav, boolean allTimeHigh) {
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
}
