package in.goldentriangle.mfa.domain.model.report.section;

import in.goldentriangle.mfa.domain.model.report.investment.ExpenseReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipReport;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
public record FundReportInvestmentSection(
        SipReport sip,
        StepUpSipReport stepUpSip,
        LumpsumReport lumpsum,
        TaxReport tax,
        ExpenseReport expense) {
}
