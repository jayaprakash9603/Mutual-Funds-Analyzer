package in.goldentriangle.mfa.domain.model.report.section;

import in.goldentriangle.mfa.domain.model.report.assessment.ProbabilityReport;
import in.goldentriangle.mfa.domain.model.report.returns.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
public record FundReportPerformanceSection(
        TrailingReturnsReport trailingReturns,
        RollingReturnsReport rollingReturns,
        BenchmarkComparisonReport benchmarkComparison,
        ProbabilityReport probability) {
}
