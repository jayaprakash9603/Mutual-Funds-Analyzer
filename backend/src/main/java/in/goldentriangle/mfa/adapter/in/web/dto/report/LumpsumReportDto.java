package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record LumpsumReportDto(
        int chartAmount,
        List<SipTimelinePointDto> timeline,
        List<LumpsumScenarioDto> scenarios) {

    public record LumpsumScenarioDto(
            int principal,
            double currentValue,
            double gain,
            double cagr,
            double moneyMultiplied) {
    }
}
