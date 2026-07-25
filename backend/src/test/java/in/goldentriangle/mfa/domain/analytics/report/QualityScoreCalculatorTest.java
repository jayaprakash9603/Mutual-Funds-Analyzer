package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.report.QualityScoreReport;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QualityScoreCalculatorTest {

    private final QualityScoreCalculator calculator = new QualityScoreCalculator();

    @Test
    void scoresKnownMetricsIncludingStdDevAndBetaRiskLevel() {
        QualityScoreReport report = calculator.compute(sampleMetrics());

        Set<String> names = report.components().stream()
                .map(QualityScoreReport.ComponentScore::name)
                .collect(Collectors.toSet());

        assertTrue(names.contains("Standard Deviation"));
        assertTrue(names.contains("Beta Risk Level"));
        assertFalse(names.contains("Expense Ratio"));
        assertFalse(names.contains("Diversification"));
        assertFalse(names.contains("Risk"));
        assertFalse(names.contains("Std Dev"));
        assertFalse(names.contains("Beta"));
        assertEquals(7, report.components().size());
        assertTrue(report.score() >= 0 && report.score() <= 100);
    }

    private static FundMetrics sampleMetrics() {
        return new FundMetrics(
                14.0, 12.0, 30.0, 2.0, 25.0, 1.0,
                65.0, 1.1, 0.9, 12.0, 10.0,
                14.0, 13.0, 2.0, 0.95, 1.2, 1.0, 0.8,
                -28.0, -32.0, 180.0, 140.0,
                "Moderate", 10.0, 70.0);
    }
}
