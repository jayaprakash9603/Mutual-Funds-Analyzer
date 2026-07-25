package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record MatrixReportDto(
        String mode,
        List<String> startLabels,
        List<Integer> holdingYears,
        List<MatrixRowDto> summaryRows,
        List<MatrixDataRowDto> dataRows) {

    public record MatrixRowDto(String label, List<Double> values) {
    }

    public record MatrixDataRowDto(String startLabel, List<MatrixCellDto> cells) {
    }

    public record MatrixCellDto(int holdingYears, Double value, String band) {
    }
}
