package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record ConsistencyDto(
        List<CalendarYearDto> calendarYears,
        List<HeatmapCellDto> monthlyHeatmap,
        double worstYear,
        double bestYear,
        double worstMonth,
        double bestMonth,
        int longestWinningStreak,
        int longestLosingStreak,
        String consistencyRating) {

    public record CalendarYearDto(int year, double returnPercent, double intraYearDrawdown) {
    }

    public record HeatmapCellDto(int year, int month, double returnPercent) {
    }
}
