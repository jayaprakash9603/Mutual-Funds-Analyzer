package in.goldentriangle.mfa.domain.analytics.insight;

import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.ArrayList;
import java.util.List;

public class InsightComposer {

    private final List<InsightGenerator> generators;

    public InsightComposer(List<InsightGenerator> generators) {
        this.generators = List.copyOf(generators);
    }

    public List<String> compose(GoldenTriangleResult result) {
        List<String> insights = new ArrayList<>();
        for (InsightGenerator generator : generators) {
            generator.generate(result).ifPresent(insights::add);
        }
        return insights;
    }
}
