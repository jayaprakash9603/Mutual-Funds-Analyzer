package in.goldentriangle.mfa.adapter.in.web.dto.section;

import in.goldentriangle.mfa.adapter.in.web.dto.report.CalendarYearInsightsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.BenchmarkComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ProbabilityDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RollingReturnsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.TrailingReturnsDto;
public record FundReportPerformanceDto(
        TrailingReturnsDto trailingReturns,
        RollingReturnsReportDto rollingReturns,
        CalendarYearInsightsReportDto calendarYearInsights,
        BenchmarkComparisonDto benchmarkComparison,
        ProbabilityDto probability) {
}
