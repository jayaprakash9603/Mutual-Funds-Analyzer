package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.OverallRating;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class RatingInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        return Optional.of(String.format(
                "Overall rating: %s (%d/3 rules passed).",
                result.overallRating().insightLabel(),
                result.passCount()));
    }
}
