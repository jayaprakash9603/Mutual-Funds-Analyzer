package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record DrawdownReportDto(
        double biggestCrash,
        double recoveryTimeYears,
        double maximumLoss,
        double averageRecoveryYears,
        double currentDrawdown,
        List<DrawdownPointDto> series,
        List<DrawdownEpisodeDto> episodes,
        List<BearMarketDecadeDto> bearMarketDecades,
        List<DrawdownThresholdRowDto> thresholdRows,
        List<DrawdownPhaseDto> phases,
        List<NavIndexPointDto> indexedNav,
        List<ThresholdRecoveryDto> thresholdRecoveries) {

    public record DrawdownPointDto(String date, double drawdownPercent) {
    }

    public record DrawdownEpisodeDto(
            String peakDate,
            String troughDate,
            String recoveryDate,
            double fallPercent,
            double recoveryYears,
            boolean recovered) {
    }

    public record BearMarketDecadeDto(
            String decadeLabel,
            double percentOfDays,
            int daysInBearMarket,
            int totalDays,
            boolean partial) {
    }

    public record DrawdownThresholdRowDto(
            double thresholdPercent,
            double fundPercentOfDays,
            int fundDaysBelow,
            double benchmarkPercentOfDays) {
    }

    public record DrawdownPhaseDto(
            String type,
            String startDate,
            String endDate,
            double changePercent,
            String durationLabel,
            double durationYears,
            boolean ongoing) {
    }

    public record NavIndexPointDto(String date, double indexValue, double nav) {
    }

    public record ThresholdRecoveryDto(
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
