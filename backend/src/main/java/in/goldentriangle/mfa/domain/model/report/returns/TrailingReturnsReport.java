package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record TrailingReturnsReport(List<PeriodReturn> periods) {

    public record PeriodReturn(
            String label,
            double absoluteReturn,
            double cagr,
            double growthOfTenThousand,
            double moneyMultiplied) {
    }
}
