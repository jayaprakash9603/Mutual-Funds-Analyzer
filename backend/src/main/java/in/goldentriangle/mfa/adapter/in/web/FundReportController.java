package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.FundReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.MatrixReportDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.config.ConditionalOnFeature;
import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
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
    private final FundReportMapper fundReportMapper;

    public FundReportController(GetFundReportUseCase getFundReportUseCase, FundReportMapper fundReportMapper) {
        this.getFundReportUseCase = getFundReportUseCase;
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
}
