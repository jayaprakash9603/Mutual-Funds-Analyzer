package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.port.in.CompareFundsUseCase;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CompareFundsService implements CompareFundsUseCase {

    private final RollingReturnsPort rollingReturnsPort;
    private final GoldenTriangleEvaluator evaluator;
    private final FeatureGuard featureGuard;

    public CompareFundsService(
            RollingReturnsPort rollingReturnsPort,
            GoldenTriangleEvaluator evaluator,
            FeatureGuard featureGuard) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.evaluator = evaluator;
        this.featureGuard = featureGuard;
    }

    @Override
    public List<GoldenTriangleResult> compare(List<String> schemes, Period period, String startDate) {
        featureGuard.require(FeatureKeys.ANALYSIS_COMPARE);
        List<GoldenTriangleResult> results = new ArrayList<>();
        for (String scheme : schemes) {
            RollingReturnsData data = rollingReturnsPort.fetch(new AnalysisQuery(scheme, period, startDate));
            results.add(evaluator.evaluate(new AnalysisInput(data.fund(), data.benchmark(), period.label())));
        }
        return results;
    }
}
