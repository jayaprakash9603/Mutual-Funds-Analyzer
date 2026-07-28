package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record LumpsumReport(
        int chartAmount,
        List<SipTimelinePoint> timeline,
        List<LumpsumScenario> scenarios) {

    public record LumpsumScenario(
            int principal,
            double currentValue,
            double gain,
            double cagr,
            double moneyMultiplied) {
    }
}
