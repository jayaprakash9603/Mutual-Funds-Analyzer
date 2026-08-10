package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record CalendarReturnsReport(
        List<MonthlyReturn> months,
        List<YearlyReturn> years,
        double bestMonth,
        double worstMonth,
        double bestYear,
        double worstYear,
        int positiveMonths,
        int totalMonths,
        List<MonthlyReturn> benchmarkMonths,
        List<YearlyReturn> benchmarkYears) {

    public CalendarReturnsReport(
            List<MonthlyReturn> months,
            List<YearlyReturn> years,
            double bestMonth,
            double worstMonth,
            double bestYear,
            double worstYear,
            int positiveMonths,
            int totalMonths) {
        this(
                months,
                years,
                bestMonth,
                worstMonth,
                bestYear,
                worstYear,
                positiveMonths,
                totalMonths,
                List.of(),
                List.of());
    }

    public record MonthlyReturn(
            int year,
            int month,
            double returnPercent,
            double startNav,
            double endNav,
            String startDate,
            String endDate) {
    }

    public record YearlyReturn(
            int year,
            double returnPercent,
            double startNav,
            double endNav,
            int monthsCovered,
            boolean partial) {
    }
}
