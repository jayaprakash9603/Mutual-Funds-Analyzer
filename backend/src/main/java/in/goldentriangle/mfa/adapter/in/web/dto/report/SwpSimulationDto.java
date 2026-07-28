package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record SwpSimulationDto(
        int scheduleDay,
        SwpScenarioDto scenario,
        List<SwpTimelinePointDto> timeline) {

    public record SwpScenarioDto(
            int initialCorpus,
            int monthlyWithdrawal,
            double totalWithdrawn,
            double remainingCorpus,
            int withdrawalCount,
            boolean depleted,
            double stcg,
            double ltcg,
            double postTaxRemaining) {
    }
}
