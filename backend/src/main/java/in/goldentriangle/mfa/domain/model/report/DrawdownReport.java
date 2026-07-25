package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record DrawdownReport(
        double biggestCrash,
        double recoveryTimeYears,
        double maximumLoss,
        double averageRecoveryYears,
        List<DrawdownPoint> series,
        List<DrawdownEpisode> episodes) {

    public record DrawdownPoint(String date, double drawdownPercent) {
    }

    public record DrawdownEpisode(
            String peakDate,
            String troughDate,
            String recoveryDate,
            double fallPercent,
            double recoveryYears) {
    }
}
