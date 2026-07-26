package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.ReturnBand;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MatrixRecoveryAnalyzerTest {

    @Test
    void marksRowsThatRecoverWithLongerHorizon() {
        MatrixReport report = new MatrixReport(
                MatrixMode.LUMPSUM,
                List.of("Jan-06", "Jan-08"),
                List.of(7, 8, 9),
                List.of(),
                List.of(
                        row("Jan-06", cell(7, 9.0), cell(8, 10.0), cell(9, 12.0)),
                        row("Jan-08", cell(7, 5.0), cell(8, 6.0), cell(9, 7.0))));

        MatrixRecoveryAnalysis analysis = MatrixRecoveryAnalyzer.analyze(report);

        assertEquals(2, analysis.instancesBelowBaseline());
        assertEquals(1, analysis.recoveredByExtension());
        assertEquals(1, analysis.neverRecovered());
        assertEquals(50.0, analysis.recoveryRatePercent(), 0.01);
        assertTrue(analysis.rows().stream().anyMatch(r -> r.startLabel().equals("Jan-06") && r.recovered()));
        assertTrue(analysis.rows().stream().anyMatch(r -> r.startLabel().equals("Jan-08") && r.exception()));
        assertEquals(List.of("Jan-08"), analysis.exceptionStartLabels());
    }

    @Test
    void skipsRowsWithoutBaselineValue() {
        MatrixReport report = new MatrixReport(
                MatrixMode.LUMPSUM,
                List.of("Jan-10"),
                List.of(7, 8),
                List.of(),
                List.of(row("Jan-10", cell(7, null), cell(8, 11.0))));

        MatrixRecoveryAnalysis analysis = MatrixRecoveryAnalyzer.analyze(report);

        assertEquals(0, analysis.instancesBelowBaseline());
        assertFalse(analysis.headline().isBlank());
    }

    private static MatrixReport.MatrixDataRow row(String label, MatrixReport.MatrixCell... cells) {
        return new MatrixReport.MatrixDataRow(label, List.of(cells));
    }

    private static MatrixReport.MatrixCell cell(int years, Double value) {
        ReturnBand band = value == null ? null : ReturnBandClassifier.classify(value);
        return new MatrixReport.MatrixCell(years, value, band);
    }
}
