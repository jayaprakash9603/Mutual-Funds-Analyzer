package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record LumpsumReportDto(List<LumpsumScenarioDto> scenarios) {

    public record LumpsumScenarioDto(
            int principal,
            double currentValue,
            double gain,
            double cagr,
            double moneyMultiplied) {
    }
}
