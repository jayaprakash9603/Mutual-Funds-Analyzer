package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.analytics.AnalyticsThresholds;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.Optional;

public class FundAgeInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        if (result.metrics().fundAgeYears() >= AnalyticsThresholds.YOUNG_FUND_YEARS) {
            return Optional.empty();
        }
        return Optional.of(String.format(
                "Note: fund history is %.1f years — %s rolling analysis may have limited windows.",
                result.metrics().fundAgeYears(),
                result.period()));
    }
}
