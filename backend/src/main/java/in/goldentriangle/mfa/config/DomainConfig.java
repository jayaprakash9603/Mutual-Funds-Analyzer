package in.goldentriangle.mfa.config;

import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.properties.MfApiProperties;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.RollingReturnsFromNav;
import in.goldentriangle.mfa.domain.analytics.TimelineBuilder;
import in.goldentriangle.mfa.domain.analytics.insight.AlphaInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.CobInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.ConsistencyInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.DrawdownInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.FundAgeInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.InsightComposer;
import in.goldentriangle.mfa.domain.analytics.insight.InsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.OutcomeInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.RatingInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.RiskProfileInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.RollingReturnInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.insight.SharpeInsightGenerator;
import in.goldentriangle.mfa.domain.analytics.rule.CobRule;
import in.goldentriangle.mfa.domain.analytics.rule.GoldenTriangleRule;
import in.goldentriangle.mfa.domain.analytics.rule.RollingReturnRule;
import in.goldentriangle.mfa.domain.analytics.rule.RuleEngine;
import in.goldentriangle.mfa.domain.analytics.rule.SharpeRule;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.util.List;

@Configuration
@EnableConfigurationProperties({FeatureFlags.class, UpstreamProperties.class, AnalyticsProperties.class, MfApiProperties.class})
public class DomainConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    MetricsCalculator metricsCalculator(AnalyticsProperties properties, Clock clock) {
        return new MetricsCalculator(properties.riskFreeRate(), properties.tradingDays(), clock);
    }

    @Bean
    RuleEngine ruleEngine() {
        List<GoldenTriangleRule> rules = List.of(
                new RollingReturnRule(),
                new CobRule(),
                new SharpeRule());
        return new RuleEngine(rules);
    }

    @Bean
    InsightComposer insightComposer() {
        List<InsightGenerator> generators = List.of(
                new RollingReturnInsightGenerator(),
                new CobInsightGenerator(),
                new SharpeInsightGenerator(),
                new RiskProfileInsightGenerator(),
                new AlphaInsightGenerator(),
                new DrawdownInsightGenerator(),
                new ConsistencyInsightGenerator(),
                new FundAgeInsightGenerator(),
                new OutcomeInsightGenerator(),
                new RatingInsightGenerator());
        return new InsightComposer(generators);
    }

    @Bean
    TimelineBuilder timelineBuilder() {
        return new TimelineBuilder();
    }

    @Bean
    GoldenTriangleEvaluator goldenTriangleEvaluator(
            MetricsCalculator metricsCalculator,
            RuleEngine ruleEngine,
            InsightComposer insightComposer,
            TimelineBuilder timelineBuilder) {
        return new GoldenTriangleEvaluator(metricsCalculator, ruleEngine, insightComposer, timelineBuilder);
    }

    @Bean
    RollingReturnsFromNav rollingReturnsFromNav() {
        return new RollingReturnsFromNav();
    }
}
