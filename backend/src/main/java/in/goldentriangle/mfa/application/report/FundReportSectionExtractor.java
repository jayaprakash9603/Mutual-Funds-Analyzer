package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;

public final class FundReportSectionExtractor {

    private FundReportSectionExtractor() {
    }

    public static FundReportOverviewSection overview(FundReport report) {
        return new FundReportOverviewSection(report.scheme(), report.profile());
    }

    public static FundReportPerformanceSection performance(FundReport report) {
        return new FundReportPerformanceSection(
                report.trailingReturns(),
                report.rollingReturns(),
                report.benchmarkComparison(),
                report.probability());
    }

    public static FundReportRiskSection risk(FundReport report) {
        return new FundReportRiskSection(
                report.risk(), report.consistency(), report.drawdown(), report.bestDays());
    }

    public static FundReportInvestmentSection investment(FundReport report) {
        return new FundReportInvestmentSection(
                report.sip(), report.lumpsum(), report.tax(), report.expense());
    }

    public static FundReportAssessmentSection assessment(FundReport report) {
        return new FundReportAssessmentSection(
                report.goldenTriangle(),
                report.qualityScore(),
                report.insights(),
                report.prosCons(),
                report.investorFit(),
                report.recommendation());
    }

    public static Object extract(ReportSectionGroup group, FundReport report) {
        return switch (group) {
            case OVERVIEW -> overview(report);
            case PERFORMANCE -> performance(report);
            case RISK -> risk(report);
            case INVESTMENT -> investment(report);
            case ASSESSMENT -> assessment(report);
        };
    }
}
