package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record CalendarReturnsDto(
        List<MonthlyReturnDto> months,
        List<YearlyReturnDto> years,
        double bestMonth,
        double worstMonth,
        double bestYear,
        double worstYear,
        int positiveMonths,
        int totalMonths) {

    public record MonthlyReturnDto(
            int year,
            int month,
            double returnPercent,
            double startNav,
            double endNav,
            String startDate,
            String endDate) {
    }

    public record YearlyReturnDto(
            int year,
            double returnPercent,
            double startNav,
            double endNav,
            int monthsCovered,
            boolean partial) {
    }
}
