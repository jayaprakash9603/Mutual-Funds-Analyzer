package in.goldentriangle.mfa.domain.model.report.matrix;

import java.util.List;

public record MatrixReport(
        MatrixMode mode,
        List<String> startLabels,
        List<Integer> holdingYears,
        List<MatrixRow> summaryRows,
        List<MatrixDataRow> dataRows) {

    public record MatrixRow(String label, List<Double> values) {
    }

    public record MatrixDataRow(String startLabel, List<MatrixCell> cells) {
    }

    public record MatrixCell(int holdingYears, Double value, ReturnBand band) {
    }
}
