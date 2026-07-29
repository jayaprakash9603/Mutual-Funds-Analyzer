package in.goldentriangle.mfa.domain.model.report;

import in.goldentriangle.mfa.domain.model.report.assessment.InvestorFitReport;
import in.goldentriangle.mfa.domain.model.report.assessment.ProbabilityReport;
import in.goldentriangle.mfa.domain.model.report.assessment.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.QualityScoreReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RecommendationReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RiskReport;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownReport;
import in.goldentriangle.mfa.domain.model.report.investment.ExpenseReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipReport;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;
import in.goldentriangle.mfa.domain.model.report.returns.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.BestDaysReport;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarYearInsightsReport;
import in.goldentriangle.mfa.domain.model.report.returns.MissingBestQuarterReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MultiplyOddsReport;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.time.Instant;
import java.util.List;

public record FundReport(
        String scheme,
        FundProfile profile,
        GoldenTriangleResult goldenTriangle,
        TrailingReturnsReport trailingReturns,
        RollingReturnsReport rollingReturns,
        CalendarYearInsightsReport calendarYearInsights,
        BenchmarkComparisonReport benchmarkComparison,
        ProbabilityReport probability,
        MultiplyOddsReport multiplyOdds,
        RiskReport risk,
        ConsistencyReport consistency,
        DrawdownReport drawdown,
        BestDaysReport bestDays,
        MissingBestQuarterReport missingBestQuarter,
        AllTimeHighsReport allTimeHighs,
        SipReport sip,
        StepUpSipReport stepUpSip,
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
