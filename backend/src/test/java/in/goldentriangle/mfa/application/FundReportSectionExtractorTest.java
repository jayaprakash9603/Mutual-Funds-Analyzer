package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.application.report.FundReportSectionExtractor;
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
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;
import in.goldentriangle.mfa.domain.model.report.returns.BenchmarkComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.ConsistencyReport;
import in.goldentriangle.mfa.domain.model.report.returns.RollingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FundReportSectionExtractorTest {

    @Test
    void splitsReportIntoAlignedSectionGroups() {
        FundReport report = mock(FundReport.class);
        when(report.scheme()).thenReturn("Test Fund");
        var profile = mock(in.goldentriangle.mfa.domain.model.report.FundProfile.class);
        when(report.profile()).thenReturn(profile);
        var trailing = mock(TrailingReturnsReport.class);
        var rolling = mock(RollingReturnsReport.class);
        var benchmark = mock(BenchmarkComparisonReport.class);
        var probability = mock(ProbabilityReport.class);
        var risk = mock(RiskReport.class);
        var consistency = mock(ConsistencyReport.class);
        var drawdown = mock(DrawdownReport.class);
        var sip = mock(SipReport.class);
        var lumpsum = mock(LumpsumReport.class);
        var tax = mock(TaxReport.class);
        var expense = mock(ExpenseReport.class);
        var golden = mock(in.goldentriangle.mfa.domain.model.GoldenTriangleResult.class);
        var quality = mock(QualityScoreReport.class);
        var prosCons = mock(ProsConsReport.class);
        var investorFit = mock(InvestorFitReport.class);
        var recommendation = mock(RecommendationReport.class);
        when(report.trailingReturns()).thenReturn(trailing);
        when(report.rollingReturns()).thenReturn(rolling);
        when(report.benchmarkComparison()).thenReturn(benchmark);
        when(report.probability()).thenReturn(probability);
        when(report.risk()).thenReturn(risk);
        when(report.consistency()).thenReturn(consistency);
        when(report.drawdown()).thenReturn(drawdown);
        when(report.sip()).thenReturn(sip);
        when(report.lumpsum()).thenReturn(lumpsum);
        when(report.tax()).thenReturn(tax);
        when(report.expense()).thenReturn(expense);
        when(report.goldenTriangle()).thenReturn(golden);
        when(report.qualityScore()).thenReturn(quality);
        when(report.insights()).thenReturn(List.of("insight"));
        when(report.prosCons()).thenReturn(prosCons);
        when(report.investorFit()).thenReturn(investorFit);
        when(report.recommendation()).thenReturn(recommendation);
        when(report.computedAt()).thenReturn(Instant.parse("2026-01-01T00:00:00Z"));

        var overview = FundReportSectionExtractor.overview(report);
        var performance = FundReportSectionExtractor.performance(report);
        var riskSection = FundReportSectionExtractor.risk(report);
        var investment = FundReportSectionExtractor.investment(report);
        var assessment = FundReportSectionExtractor.assessment(report);

        assertEquals("Test Fund", overview.scheme());
        assertSame(profile, overview.profile());
        assertSame(trailing, performance.trailingReturns());
        assertSame(risk, riskSection.risk());
        assertSame(sip, investment.sip());
        assertSame(golden, assessment.goldenTriangle());
        assertEquals(List.of("insight"), assessment.insights());
    }
}
