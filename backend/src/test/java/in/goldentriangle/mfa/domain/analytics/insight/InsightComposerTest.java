package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.OverallRating;
import in.goldentriangle.mfa.domain.model.RuleResult;
import in.goldentriangle.mfa.domain.model.RuleId;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InsightComposerTest {

    @Test
    void defensiveOutperformerAndAggressiveUnderperformerProduceDifferentText() {
        InsightComposer composer = new InsightComposer(List.of(
                new RollingReturnInsightGenerator(),
                new RiskProfileInsightGenerator()));

        GoldenTriangleResult outperformer = sampleResult(0.7, 12, 16, 5, 23, 16);
        GoldenTriangleResult underperformer = sampleResult(1.3, 22, 16, -2, 10, 16);

        String outText = String.join(" ", composer.compose(outperformer));
        String underText = String.join(" ", composer.compose(underperformer));

        assertTrue(outText.contains("Defensive profile"));
        assertTrue(underText.contains("Aggressive profile"));
        assertNotEquals(outText, underText);
    }

    @Test
    void outputNeverContainsNaNOrUndefined() {
        InsightComposer composer = new InsightComposer(List.of(
                new RollingReturnInsightGenerator(),
                new CobInsightGenerator(),
                new SharpeInsightGenerator(),
                new RiskProfileInsightGenerator(),
                new AlphaInsightGenerator(),
                new DrawdownInsightGenerator(),
                new ConsistencyInsightGenerator(),
                new OutcomeInsightGenerator(),
                new RatingInsightGenerator()));

        String text = String.join(" ", composer.compose(sampleResult(0.75, 14, 16, 6, 23, 16)));
        assertFalse(text.contains("NaN"));
        assertFalse(text.contains("undefined"));
    }

    private GoldenTriangleResult sampleResult(
            double beta,
            double fundVol,
            double benchVol,
            double alpha,
            double fundRolling,
            double benchRolling) {
        FundMetrics metrics = new FundMetrics(
                fundRolling, benchRolling, 28, 12, 20, 8, 76.3, 1.17, 0.66,
                18, 14, fundVol, benchVol, alpha, beta, 1.4, 0.2, 0.5,
                -25, -32, 470, 300, "Medium", 12, 80);
        return new GoldenTriangleResult(
                List.of(new RuleResult(RuleId.ROLLING_RETURN, "Rolling Return", true, fundRolling, benchRolling, "")),
                3,
                OverallRating.PASSED,
                true,
                metrics,
                "Test Fund",
                "Test Benchmark",
                "Flexi Cap",
                "5 Year");
    }
}
