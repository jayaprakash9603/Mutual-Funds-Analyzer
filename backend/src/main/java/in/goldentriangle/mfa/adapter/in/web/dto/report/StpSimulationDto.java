package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record StpSimulationDto(
        String sourceScheme,
        String targetScheme,
        int scheduleDay,
        int transferMonths,
        StpScenarioDto scenario,
        List<StpTimelinePointDto> timeline) {

    public record StpScenarioDto(
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
