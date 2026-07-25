package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class AlphaInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        FundMetrics metrics = result.metrics();
        if (metrics.alpha() > 0) {
            return Optional.of(String.format(
                    "Positive alpha of %.2f%% suggests manager skill beyond market exposure (info ratio %.2f).",
                    metrics.alpha(),
                    metrics.informationRatio()));
        }
        return Optional.of(String.format(
                "Negative alpha of %.2f%% — the fund has not added value beyond its benchmark exposure.",
                metrics.alpha()));
    }
}
