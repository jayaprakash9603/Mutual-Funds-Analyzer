package in.goldentriangle.mfa.domain.model.report.section;

import in.goldentriangle.mfa.domain.model.report.investment.ExpenseReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
public record FundReportInvestmentSection(
        SipReport sip,
        LumpsumReport lumpsum,
        TaxReport tax,
        ExpenseReport expense) {
}
