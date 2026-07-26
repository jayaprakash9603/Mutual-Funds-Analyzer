package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record ConsistencyReport(
        List<CalendarYearReturn> calendarYears,
        List<HeatmapCell> monthlyHeatmap,
        double worstYear,
        double bestYear,
        double worstMonth,
        double bestMonth,
        int longestWinningStreak,
        int longestLosingStreak,
        String consistencyRating) {

    public record CalendarYearReturn(int year, double returnPercent, double intraYearDrawdown) {
    }

    public record HeatmapCell(int year, int month, double returnPercent) {
    }
}
