package in.goldentriangle.mfa.adapter.in.web.dto;

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
            double postTaxReturn) {
    }
}
