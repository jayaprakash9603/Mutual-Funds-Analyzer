package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record MatrixRecoveryAnalysis(
        int baselineHoldingYears,
        double strongReturnThreshold,
        int instancesBelowBaseline,
        int recoveredByExtension,
        int neverRecovered,
        double recoveryRatePercent,
        Integer maxExtensionYears,
        List<RecoveryRow> rows,
        List<String> exceptionStartLabels,
        String headline,
        String summary) {

    public record RecoveryRow(
            String startLabel,
            Double baselineReturn,
            Integer recoveryHoldingYears,
            Double recoveryReturn,
            boolean recovered,
            boolean exception) {
    }

    public static MatrixRecoveryAnalysis empty() {
        return new MatrixRecoveryAnalysis(
                7,
                10,
                0,
                0,
                0,
                0,
                null,
                List.of(),
                List.of(),
                "",
                "");
    }
}
