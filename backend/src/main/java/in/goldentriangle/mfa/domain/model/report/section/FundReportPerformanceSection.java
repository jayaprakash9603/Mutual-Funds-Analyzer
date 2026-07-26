package in.goldentriangle.mfa.domain.model.report.section;

import in.goldentriangle.mfa.domain.model.report.assessment.ProbabilityReport;
import in.goldentriangle.mfa.domain.model.report.returns.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarYearInsightsReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
public record FundReportPerformanceSection(
        TrailingReturnsReport trailingReturns,
        RollingReturnsReport rollingReturns,
        CalendarYearInsightsReport calendarYearInsights,
        BenchmarkComparisonReport benchmarkComparison,
        ProbabilityReport probability) {
}
