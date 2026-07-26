package in.goldentriangle.mfa.adapter.in.web.dto.report;

import in.goldentriangle.mfa.domain.analytics.report.sip.Xirr;
import java.util.List;

public record SipReportDto(List<SipScenarioDto> scenarios) {

    public record SipScenarioDto(
            int monthlyAmount,
            double currentValue,
            double totalGain,
            double xirr,
            double moneyInvested,
            double projectedValue10Y,
            double stcg,
            double ltcg,
            double postTaxXirr) {
    }
}
