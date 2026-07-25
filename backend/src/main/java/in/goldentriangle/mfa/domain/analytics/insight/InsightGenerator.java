package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public interface InsightGenerator {
    Optional<String> generate(GoldenTriangleResult result);
}
