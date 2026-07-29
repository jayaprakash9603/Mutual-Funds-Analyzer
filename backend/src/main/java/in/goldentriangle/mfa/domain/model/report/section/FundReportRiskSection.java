package in.goldentriangle.mfa.domain.model.report.section;

import in.goldentriangle.mfa.domain.model.report.assessment.RiskReport;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownReport;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;
import in.goldentriangle.mfa.domain.model.report.returns.BestDaysReport;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.returns.MissingBestQuarterReport;
public record FundReportRiskSection(
        RiskReport risk,
        ConsistencyReport consistency,
        DrawdownReport drawdown,
        BestDaysReport bestDays,
        MissingBestQuarterReport missingBestQuarter,
        AllTimeHighsReport allTimeHighs) {
}
