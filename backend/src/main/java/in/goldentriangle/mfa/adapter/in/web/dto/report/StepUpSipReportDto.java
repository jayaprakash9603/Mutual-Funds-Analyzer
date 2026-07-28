package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record StepUpSipReportDto(
        int scheduleDay,
        int chartInitialAmount,
        String stepUpMode,
        double stepUpPercent,
        int stepUpAmount,
        List<SipTimelinePointDto> timeline,
        List<StepUpSipScenarioDto> scenarios) {

    public record StepUpSipScenarioDto(
            int initialMonthlyAmount,
            int currentMonthlyAmount,
            String stepUpMode,
            double stepUpValue,
            double currentValue,
            double totalGain,
            double xirr,
            double moneyInvested,
            double projectedValue10Y,
            double stcg,
            double ltcg,
            double postTaxXirr,
            int instalmentCount) {
    }
}
