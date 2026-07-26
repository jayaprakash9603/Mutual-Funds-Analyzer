package in.goldentriangle.mfa.application.catalog;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundAnalysis;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.TimelineEvent;
import in.goldentriangle.mfa.domain.port.in.AnalyseFundUseCase;
import in.goldentriangle.mfa.domain.port.out.AnalysisRepositoryPort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
public class AnalyseFundService implements AnalyseFundUseCase {

    private final RollingReturnsPort rollingReturnsPort;
    private final GoldenTriangleEvaluator evaluator;
    private final AnalysisRepositoryPort analysisRepositoryPort;
    private final FeatureGuard featureGuard;
    private final FeatureFlags featureFlags;
    private final Clock clock;

    public AnalyseFundService(
            RollingReturnsPort rollingReturnsPort,
            GoldenTriangleEvaluator evaluator,
            AnalysisRepositoryPort analysisRepositoryPort,
            FeatureGuard featureGuard,
            FeatureFlags featureFlags,
            Clock clock) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.evaluator = evaluator;
        this.analysisRepositoryPort = analysisRepositoryPort;
        this.featureGuard = featureGuard;
        this.featureFlags = featureFlags;
        this.clock = clock;
    }

    @Override
    public FundAnalysis analyse(AnalysisQuery query) {
        featureGuard.require(FeatureKeys.ANALYSIS_ENABLED);

        RollingReturnsData data = rollingReturnsPort.fetch(query);
        AnalysisInput input = new AnalysisInput(data.fund(), data.benchmark(), query.period().label());
        GoldenTriangleResult result = evaluator.evaluate(input);

        List<String> insights = List.of();
        if (featureFlags.getAnalysis().isInsights()) {
            featureGuard.require(FeatureKeys.ANALYSIS_INSIGHTS);
            insights = evaluator.generateInsights(result);
        }

        List<TimelineEvent> timeline = List.of();
        if (featureFlags.getAnalysis().isTimeline()) {
            featureGuard.require(FeatureKeys.ANALYSIS_TIMELINE);
            timeline = evaluator.buildTimeline(result, data.fund());
        }

        FundAnalysis analysis = new FundAnalysis(
                query.scheme(),
                query.period(),
                result,
                insights,
                timeline,
                Instant.now(clock));

        if (featureFlags.getAnalysis().isPersistResults()) {
            analysisRepositoryPort.save(analysis);
        }

        return analysis;
    }
}
