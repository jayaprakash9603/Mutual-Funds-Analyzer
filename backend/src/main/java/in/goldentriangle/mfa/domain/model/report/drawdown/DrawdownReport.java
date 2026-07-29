package in.goldentriangle.mfa.domain.model.report.drawdown;

import java.util.List;

public record DrawdownReport(
        double biggestCrash,
        double recoveryTimeYears,
        double maximumLoss,
        double averageRecoveryYears,
        double currentDrawdown,
        List<DrawdownPoint> series,
        List<DrawdownEpisode> episodes,
        List<BearMarketDecade> bearMarketDecades,
        List<DrawdownThresholdRow> thresholdRows,
        List<DrawdownPhase> phases,
        List<NavIndexPoint> indexedNav,
        List<ThresholdRecovery> thresholdRecoveries) {

    public record DrawdownPoint(String date, double drawdownPercent) {
    }

    public record DrawdownEpisode(
            String peakDate,
            String troughDate,
            String recoveryDate,
            double fallPercent,
            double recoveryYears,
            boolean recovered) {
    }

    public record BearMarketDecade(
            String decadeLabel,
            double percentOfDays,
            int daysInBearMarket,
            int totalDays,
            boolean partial) {
    }

    public record DrawdownThresholdRow(
            double thresholdPercent,
            double fundPercentOfDays,
            int fundDaysBelow,
            double benchmarkPercentOfDays) {
    }

    public record DrawdownPhase(
            String type,
            String startDate,
            String endDate,
            double changePercent,
            String durationLabel,
            double durationYears,
            boolean ongoing) {
    }

    public record NavIndexPoint(String date, double indexValue, double nav) {
    }

    public record ThresholdRecovery(
            double thresholdPercent,
            int sequence,
            String crossDate,
            String recoveryDate,
            double recoveryYears,
            String recoveryDurationLabel,
            double returnPercent,
            boolean usesCagr,
            boolean recovered) {
    }
}
