package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record SipReport(
        int scheduleDay,
        int chartAmount,
        List<SipTimelinePoint> timeline,
        List<SipScenario> scenarios) {

    public record SipScenario(
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
