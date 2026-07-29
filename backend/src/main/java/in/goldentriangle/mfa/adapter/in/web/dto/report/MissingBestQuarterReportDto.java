package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record MissingBestQuarterReportDto(
        String periodLabel,
        List<QuarterPointDto> series,
        double averageLostPercent,
        double latestLostPercent,
        String latestQuarterLabel,
        String headline) {

    public record QuarterPointDto(
            String quarterLabel,
            String quarterEndDate,
            double fullCagrPercent,
            double exBestQuarterCagrPercent,
            double lostCagrPercent,
            String bestQuarterLabel) {
    }
}
