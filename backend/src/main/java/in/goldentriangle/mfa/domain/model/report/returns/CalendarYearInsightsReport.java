package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record CalendarYearInsightsReport(
        AnnualReturnDistribution distribution,
        SortedCalendarReturns sortedReturns,
        ProfitBookingComparison profitBooking) {

    public record AnnualReturnDistribution(
            List<ReturnBucket> buckets,
            double positiveYearsPercent,
            double negativeYearsPercent,
            int positiveYearCount,
            int negativeYearCount,
            int totalYears,
            String headline) {
    }

    public record ReturnBucket(
            String label,
            double minInclusive,
            Double maxExclusive,
            double percentOfYears,
            int yearCount) {
    }

    public record SortedCalendarReturns(
            String periodLabel,
            double cagrPercent,
            double moneyMultiple,
            double longTermBandLow,
            double longTermBandHigh,
            List<RankedYearReturn> years,
            String headline) {
    }

    public record RankedYearReturn(
            int year,
            double returnPercent,
            boolean inLongTermBand) {
    }

    public record ProfitBookingComparison(
            int rollingWindowYears,
            double debtAnnualReturnPercent,
            List<ProfitBookingRow> rows,
            String headline,
            String methodologyNote) {
    }

    public record ProfitBookingRow(
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
