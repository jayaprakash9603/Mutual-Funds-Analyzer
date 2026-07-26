package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.ReportSectionEnvelope;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;

public interface GetFundReportSectionUseCase {

    ReportSectionEnvelope<FundReportOverviewSection> getOverview(String scheme, String startDate);

    ReportSectionEnvelope<FundReportPerformanceSection> getPerformance(String scheme, String startDate);

    ReportSectionEnvelope<FundReportRiskSection> getRisk(String scheme, String startDate);

    ReportSectionEnvelope<FundReportInvestmentSection> getInvestment(String scheme, String startDate);

    ReportSectionEnvelope<FundReportAssessmentSection> getAssessment(String scheme, String startDate);

    default ReportSectionEnvelope<?> get(ReportSectionGroup group, String scheme, String startDate) {
        return switch (group) {
            case OVERVIEW -> getOverview(scheme, startDate);
            case PERFORMANCE -> getPerformance(scheme, startDate);
            case RISK -> getRisk(scheme, startDate);
            case INVESTMENT -> getInvestment(scheme, startDate);
            case ASSESSMENT -> getAssessment(scheme, startDate);
        };
    }
}
