package in.goldentriangle.mfa.domain.model.report;

import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.time.Instant;
import java.util.List;

public record FundReport(
        String scheme,
        FundProfile profile,
        GoldenTriangleResult goldenTriangle,
        TrailingReturnsReport trailingReturns,
        RollingReturnsReport rollingReturns,
        BenchmarkComparisonReport benchmarkComparison,
        ProbabilityReport probability,
        RiskReport risk,
        ConsistencyReport consistency,
        DrawdownReport drawdown,
        SipReport sip,
        LumpsumReport lumpsum,
        TaxReport tax,
        ExpenseReport expense,
        QualityScoreReport qualityScore,
        List<String> insights,
        ProsConsReport prosCons,
        InvestorFitReport investorFit,
        RecommendationReport recommendation,
        Instant computedAt) {
}
