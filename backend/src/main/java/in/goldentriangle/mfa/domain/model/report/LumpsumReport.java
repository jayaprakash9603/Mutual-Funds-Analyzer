package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record LumpsumReport(List<LumpsumScenario> scenarios) {

    public record LumpsumScenario(
            int principal,
            double currentValue,
            double gain,
            double cagr,
            double moneyMultiplied) {
    }
}
