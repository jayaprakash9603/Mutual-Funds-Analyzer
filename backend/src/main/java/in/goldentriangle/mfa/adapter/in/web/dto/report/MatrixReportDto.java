package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.time.Instant;
import java.util.List;

public record MatrixReportDto(
        String mode,
        List<String> startLabels,
        List<Integer> holdingYears,
        List<MatrixRowDto> summaryRows,
        List<MatrixDataRowDto> dataRows,
        MatrixRecoveryDto recovery,
        Instant lastNavDate,
        Instant computedAt,
        boolean fromSnapshot) {

    public record MatrixRowDto(String label, List<Double> values) {
    }

    public record MatrixDataRowDto(String startLabel, List<MatrixCellDto> cells) {
    }

    public record MatrixCellDto(int holdingYears, Double value, String band) {
    }

    public record MatrixRecoveryDto(
            int baselineHoldingYears,
            double strongReturnThreshold,
            int instancesBelowBaseline,
            int recoveredByExtension,
            int neverRecovered,
            double recoveryRatePercent,
            Integer maxExtensionYears,
            List<RecoveryRowDto> rows,
            List<String> exceptionStartLabels,
            String headline,
            String summary) {

        public record RecoveryRowDto(
                String startLabel,
                Double baselineReturn,
                Integer recoveryHoldingYears,
                Double recoveryReturn,
                boolean recovered,
                boolean exception) {
        }
    }
}
