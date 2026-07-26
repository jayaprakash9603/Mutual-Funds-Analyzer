package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record TrailingReturnsDto(List<PeriodReturnDto> periods) {

    public record PeriodReturnDto(
            String label,
            double absoluteReturn,
            double cagr,
            double growthOfTenThousand,
            double moneyMultiplied) {
    }
}
