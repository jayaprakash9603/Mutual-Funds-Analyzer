package in.goldentriangle.mfa.adapter.in.web.dto.section;

import in.goldentriangle.mfa.adapter.in.web.dto.report.ExpenseReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.LumpsumReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.StepUpSipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.TaxReportDto;
public record FundReportInvestmentDto(
        SipReportDto sip,
        StepUpSipReportDto stepUpSip,
        LumpsumReportDto lumpsum,
        TaxReportDto tax,
        ExpenseReportDto expense) {
}
