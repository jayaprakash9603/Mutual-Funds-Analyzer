package in.goldentriangle.mfa.adapter.in.web.dto.section;

import in.goldentriangle.mfa.adapter.in.web.dto.common.GoldenTriangleResultDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.InvestorFitDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ProsConsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.QualityScoreDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RecommendationDto;
import java.util.List;

public record FundReportAssessmentDto(
        GoldenTriangleResultDto goldenTriangle,
        QualityScoreDto qualityScore,
        List<String> insights,
        ProsConsDto prosCons,
        InvestorFitDto investorFit,
        RecommendationDto recommendation) {
}
