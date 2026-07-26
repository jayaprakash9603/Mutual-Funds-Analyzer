package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportAssessmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.FundReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportInvestmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportOverviewDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportPerformanceDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportRiskDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.MatrixReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.ReportSectionEnvelopeDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.port.in.GetFundReportSectionUseCase;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@ConditionalOnFeature(FeatureKeys.ANALYSIS_FUND_REPORT)
public class FundReportController {

    private final GetFundReportUseCase getFundReportUseCase;
    private final GetFundReportSectionUseCase getFundReportSectionUseCase;
    private final FundReportMapper fundReportMapper;

    public FundReportController(
            GetFundReportUseCase getFundReportUseCase,
            GetFundReportSectionUseCase getFundReportSectionUseCase,
            FundReportMapper fundReportMapper) {
        this.getFundReportUseCase = getFundReportUseCase;
        this.getFundReportSectionUseCase = getFundReportSectionUseCase;
        this.fundReportMapper = fundReportMapper;
    }

    @GetMapping("/fund-report")
    FundReportDto getReport(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
        return fundReportMapper.toDto(getFundReportUseCase.get(scheme, startDate));
    }

    @GetMapping("/fund-report/matrix")
    MatrixReportDto getMatrix(
            @RequestParam String scheme,
            @RequestParam(defaultValue = "LUMPSUM") String mode,
            @RequestParam(name = "start_date", required = false) String startDate) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
        MatrixMode matrixMode = MatrixMode.valueOf(mode.toUpperCase());
        return fundReportMapper.toDto(getFundReportUseCase.getMatrix(scheme, startDate, matrixMode));
    }

    @GetMapping("/fund-report/overview")
    ReportSectionEnvelopeDto<FundReportOverviewDto> getOverview(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        return fundReportMapper.toOverviewDto(getFundReportSectionUseCase.getOverview(scheme, startDate));
    }

    @GetMapping("/fund-report/performance")
    ReportSectionEnvelopeDto<FundReportPerformanceDto> getPerformance(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        return fundReportMapper.toPerformanceDto(getFundReportSectionUseCase.getPerformance(scheme, startDate));
    }

    @GetMapping("/fund-report/risk")
    ReportSectionEnvelopeDto<FundReportRiskDto> getRisk(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        return fundReportMapper.toRiskDto(getFundReportSectionUseCase.getRisk(scheme, startDate));
    }

    @GetMapping("/fund-report/investment")
    ReportSectionEnvelopeDto<FundReportInvestmentDto> getInvestment(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        return fundReportMapper.toInvestmentDto(getFundReportSectionUseCase.getInvestment(scheme, startDate));
    }

    @GetMapping("/fund-report/assessment")
    ReportSectionEnvelopeDto<FundReportAssessmentDto> getAssessment(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        return fundReportMapper.toAssessmentDto(getFundReportSectionUseCase.getAssessment(scheme, startDate));
    }

    private static void requireScheme(String scheme) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
    }
}
