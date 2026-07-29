package in.goldentriangle.mfa.domain.model.report.returns;

import java.util.List;

public record MissingBestQuarterReport(
        String periodLabel,
        List<QuarterPoint> series,
        double averageLostPercent,
        double latestLostPercent,
        String latestQuarterLabel,
        String headline) {

    public record QuarterPoint(
            String quarterLabel,
            String quarterEndDate,
            double fullCagrPercent,
            double exBestQuarterCagrPercent,
            double lostCagrPercent,
            String bestQuarterLabel) {
    }
}
