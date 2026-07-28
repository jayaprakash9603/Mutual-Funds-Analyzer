package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record StepUpSipReport(
        int scheduleDay,
        int chartInitialAmount,
        StepUpMode stepUpMode,
        double stepUpPercent,
        int stepUpAmount,
        List<SipTimelinePoint> timeline,
        List<StepUpSipScenario> scenarios) {

    public record StepUpSipScenario(
            int initialMonthlyAmount,
            int currentMonthlyAmount,
            StepUpMode stepUpMode,
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
