package in.goldentriangle.mfa.adapter.in.web.dto.section;

import in.goldentriangle.mfa.adapter.in.web.dto.report.ConsistencyDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.DrawdownReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RiskReportDto;
public record FundReportRiskDto(
        RiskReportDto risk,
        ConsistencyDto consistency,
        DrawdownReportDto drawdown) {
}
