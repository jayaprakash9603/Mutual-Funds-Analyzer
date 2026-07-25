package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record SipReport(List<SipScenario> scenarios) {

    public record SipScenario(
            int monthlyAmount,
            double currentValue,
            double totalGain,
            double xirr,
            double moneyInvested,
            double projectedValue10Y) {
    }
}
