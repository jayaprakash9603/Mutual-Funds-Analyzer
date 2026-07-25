package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.RuleResult;

import java.util.Optional;
import java.util.stream.Collectors;

public class OutcomeInsightGenerator implements InsightGenerator {

    @Override
    public Optional<String> generate(GoldenTriangleResult result) {
        if (result.passed()) {
            return Optional.of("This fund satisfies all three Golden Triangle conditions.");
        }
        String failed = result.rules().stream()
                .filter(rule -> !rule.passed())
                .map(RuleResult::label)
                .collect(Collectors.joining(", "));
        return Optional.of("Failed criteria: " + failed + ".");
    }
}
