package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record StpSimulation(StpScenario scenario, List<StpTimelinePoint> timeline) {

    public record StpScenario(
            int lumpSum,
            int monthlyTransfer,
            int transferMonths,
            double totalTransferred,
            int transferCount,
            double sourceRemaining,
            double targetValue,
            double totalValue,
            double totalGain,
            double xirr) {
    }
}
