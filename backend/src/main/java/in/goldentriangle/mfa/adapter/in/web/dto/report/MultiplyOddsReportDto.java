package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record MultiplyOddsReportDto(
        String periodLabel,
        List<Integer> holdingYears,
        List<MultiplyRowDto> rows,
        String headline) {

    public record MultiplyRowDto(
            int multiply,
            List<OddsCellDto> cells,
            List<Integer> highlightYears,
            Double calloutPercent) {
    }

    public record OddsCellDto(int holdingYears, Double percent, int sampleCount, int hitCount) {
    }
}
