package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record SwpReport(
        int scheduleDay,
        int chartCorpus,
        int chartWithdrawal,
        List<SwpTimelinePoint> timeline,
        List<SwpScenario> scenarios) {

    public record SwpScenario(
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
