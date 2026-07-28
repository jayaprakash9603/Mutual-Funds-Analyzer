package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record SipReportDto(
        int scheduleDay,
        int chartAmount,
        List<SipTimelinePointDto> timeline,
        List<SipScenarioDto> scenarios) {

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
