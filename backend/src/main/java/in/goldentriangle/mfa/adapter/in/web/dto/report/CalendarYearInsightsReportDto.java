package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record CalendarYearInsightsReportDto(
        AnnualReturnDistributionDto distribution,
        SortedCalendarReturnsDto sortedReturns,
        ProfitBookingComparisonDto profitBooking) {

    public record AnnualReturnDistributionDto(
            List<ReturnBucketDto> buckets,
            double positiveYearsPercent,
            double negativeYearsPercent,
            int positiveYearCount,
            int negativeYearCount,
            int totalYears,
            String headline) {
    }

    public record ReturnBucketDto(
            String label,
            double minInclusive,
            Double maxExclusive,
            double percentOfYears,
            int yearCount) {
    }

    public record SortedCalendarReturnsDto(
            String periodLabel,
            double cagrPercent,
            double moneyMultiple,
            double longTermBandLow,
            double longTermBandHigh,
            List<RankedYearReturnDto> years,
            String headline) {
    }

    public record RankedYearReturnDto(int year, double returnPercent, boolean inLongTermBand) {
    }

    public record ProfitBookingComparisonDto(
            int rollingWindowYears,
            double debtAnnualReturnPercent,
            List<ProfitBookingRowDto> rows,
            String headline,
            String methodologyNote) {
    }

    public record ProfitBookingRowDto(
            String periodLabel,
            int startYear,
            int endYear,
            double buyHoldCagrPercent,
            double outperformanceAt20Percent,
            double outperformanceAt30Percent,
            double outperformanceAt50Percent,
            double outperformanceAtAllTimeHighPercent) {
    }
}
