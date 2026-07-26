package in.goldentriangle.mfa.domain.model.report.investment;

import in.goldentriangle.mfa.domain.analytics.report.sip.Xirr;
import java.util.List;

public record SipReport(List<SipScenario> scenarios) {

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
