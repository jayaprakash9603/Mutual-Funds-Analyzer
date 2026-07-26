package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record DrawdownReportDto(
        double biggestCrash,
        double recoveryTimeYears,
        double maximumLoss,
        double averageRecoveryYears,
        double currentDrawdown,
        List<DrawdownPointDto> series,
        List<DrawdownEpisodeDto> episodes) {

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
}
