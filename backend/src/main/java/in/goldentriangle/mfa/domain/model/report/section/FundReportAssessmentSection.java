package in.goldentriangle.mfa.domain.model.report.section;

import in.goldentriangle.mfa.domain.model.report.assessment.InvestorFitReport;
import in.goldentriangle.mfa.domain.model.report.assessment.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.QualityScoreReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RecommendationReport;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;

import java.util.List;

public record FundReportAssessmentSection(
        GoldenTriangleResult goldenTriangle,
        QualityScoreReport qualityScore,
        List<String> insights,
        ProsConsReport prosCons,
        InvestorFitReport investorFit,
        RecommendationReport recommendation) {
}
