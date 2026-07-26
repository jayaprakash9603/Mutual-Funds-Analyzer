package in.goldentriangle.mfa.adapter.in.web.dto.report;

import in.goldentriangle.mfa.adapter.in.web.dto.common.GoldenTriangleResultDto;
import java.time.Instant;
import java.util.List;

public record FundReportDto(
        String scheme,
        FundProfileDto profile,
        GoldenTriangleResultDto goldenTriangle,
        TrailingReturnsDto trailingReturns,
        RollingReturnsReportDto rollingReturns,
        BenchmarkComparisonDto benchmarkComparison,
        ProbabilityDto probability,
        RiskReportDto risk,
        ConsistencyDto consistency,
        DrawdownReportDto drawdown,
        BestDaysReportDto bestDays,
        SipReportDto sip,
        LumpsumReportDto lumpsum,
        TaxReportDto tax,
        ExpenseReportDto expense,
        QualityScoreDto qualityScore,
        List<String> insights,
        ProsConsDto prosCons,
        InvestorFitDto investorFit,
        RecommendationDto recommendation,
        Instant computedAt) {
}
