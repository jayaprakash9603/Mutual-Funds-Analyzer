package in.goldentriangle.mfa.domain.model.report.matrix;

import java.util.List;

public record MultiplyOddsReport(
        String periodLabel,
        List<Integer> holdingYears,
        List<MultiplyRow> rows,
        String headline) {

    public record MultiplyRow(int multiply, List<OddsCell> cells, List<Integer> highlightYears, Double calloutPercent) {
    }

    public record OddsCell(int holdingYears, Double percent, int sampleCount, int hitCount) {
    }
}
