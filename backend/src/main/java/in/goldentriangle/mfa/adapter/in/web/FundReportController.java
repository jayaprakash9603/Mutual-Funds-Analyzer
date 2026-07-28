package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportAssessmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.FundReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportInvestmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportOverviewDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportPerformanceDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportRiskDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.MatrixReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.LumpsumSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SipSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.StepUpSipSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SwpSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.ReportSectionEnvelopeDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.adapter.in.web.support.ReportSectionResponses;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.adapter.in.web.dto.report.StepUpSipSimulationDto;
import in.goldentriangle.mfa.domain.analytics.report.sip.StepUpSipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.SipCalculator;
import in.goldentriangle.mfa.domain.analytics.report.sip.SwpCalculator;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpMode;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipConfig;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.port.in.GetFundReportSectionUseCase;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
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

    @GetMapping("/fund-report/sip/simulate")
    SipSimulationDto simulateSip(
            @RequestParam String scheme,
            @RequestParam(defaultValue = "10000") int amount,
            @RequestParam(name = "schedule_day", defaultValue = "1") int scheduleDay,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        int day = SipCalculator.clampScheduleDay(scheduleDay);
        return fundReportMapper.toDto(
                getFundReportUseCase.simulateSip(scheme, startDate, amount, day),
                day);
    }

    @GetMapping("/fund-report/lumpsum/simulate")
    LumpsumSimulationDto simulateLumpsum(
            @RequestParam String scheme,
            @RequestParam(defaultValue = "100000") int principal,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        return fundReportMapper.toDto(getFundReportUseCase.simulateLumpsum(scheme, startDate, principal));
    }

    @GetMapping("/fund-report/step-up-sip/simulate")
    StepUpSipSimulationDto simulateStepUpSip(
            @RequestParam String scheme,
            @RequestParam(name = "initial_amount", defaultValue = "10000") int initialAmount,
            @RequestParam(name = "schedule_day", defaultValue = "1") int scheduleDay,
            @RequestParam(name = "step_up_mode", defaultValue = "PERCENT") String stepUpMode,
            @RequestParam(name = "step_up_percent", defaultValue = "10") double stepUpPercent,
            @RequestParam(name = "step_up_amount", defaultValue = "0") int stepUpAmount,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        StepUpMode mode = parseStepUpMode(stepUpMode);
        validateStepUpConfig(mode, stepUpPercent, stepUpAmount);
        StepUpSipConfig config = StepUpSipCalculator.normalize(new StepUpSipConfig(
                initialAmount,
                SipCalculator.clampScheduleDay(scheduleDay),
                mode,
                stepUpPercent,
                stepUpAmount));
        return fundReportMapper.toDto(
                getFundReportUseCase.simulateStepUpSip(scheme, startDate, config),
                config);
    }

    @GetMapping("/fund-report/swp/simulate")
    SwpSimulationDto simulateSwp(
            @RequestParam String scheme,
            @RequestParam(name = "initial_corpus", defaultValue = "1000000") int initialCorpus,
            @RequestParam(name = "monthly_withdrawal", defaultValue = "10000") int monthlyWithdrawal,
            @RequestParam(name = "schedule_day", defaultValue = "1") int scheduleDay,
            @RequestParam(name = "start_date", required = false) String startDate) {
        requireScheme(scheme);
        int day = SwpCalculator.clampScheduleDay(scheduleDay);
        return fundReportMapper.toDto(
                getFundReportUseCase.simulateSwp(scheme, startDate, initialCorpus, monthlyWithdrawal, day),
                day);
    }

    @GetMapping("/fund-report/overview")
    ResponseEntity<ReportSectionEnvelopeDto<FundReportOverviewDto>> getOverview(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate,
            @RequestHeader(name = "If-None-Match", required = false) String ifNoneMatch) {
        requireScheme(scheme);
        return ReportSectionResponses.ok(
                fundReportMapper.toOverviewDto(getFundReportSectionUseCase.getOverview(scheme, startDate)),
                ifNoneMatch);
    }

    @GetMapping("/fund-report/performance")
    ResponseEntity<ReportSectionEnvelopeDto<FundReportPerformanceDto>> getPerformance(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate,
            @RequestHeader(name = "If-None-Match", required = false) String ifNoneMatch) {
        requireScheme(scheme);
        return ReportSectionResponses.ok(
                fundReportMapper.toPerformanceDto(getFundReportSectionUseCase.getPerformance(scheme, startDate)),
                ifNoneMatch);
    }

    @GetMapping("/fund-report/risk")
    ResponseEntity<ReportSectionEnvelopeDto<FundReportRiskDto>> getRisk(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate,
            @RequestHeader(name = "If-None-Match", required = false) String ifNoneMatch) {
        requireScheme(scheme);
        return ReportSectionResponses.ok(
                fundReportMapper.toRiskDto(getFundReportSectionUseCase.getRisk(scheme, startDate)),
                ifNoneMatch);
    }

    @GetMapping("/fund-report/investment")
    ResponseEntity<ReportSectionEnvelopeDto<FundReportInvestmentDto>> getInvestment(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate,
            @RequestHeader(name = "If-None-Match", required = false) String ifNoneMatch) {
        requireScheme(scheme);
        return ReportSectionResponses.ok(
                fundReportMapper.toInvestmentDto(getFundReportSectionUseCase.getInvestment(scheme, startDate)),
                ifNoneMatch);
    }

    @GetMapping("/fund-report/assessment")
    ResponseEntity<ReportSectionEnvelopeDto<FundReportAssessmentDto>> getAssessment(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate,
            @RequestHeader(name = "If-None-Match", required = false) String ifNoneMatch) {
        requireScheme(scheme);
        return ReportSectionResponses.ok(
                fundReportMapper.toAssessmentDto(getFundReportSectionUseCase.getAssessment(scheme, startDate)),
                ifNoneMatch);
    }

    private static void requireScheme(String scheme) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
    }

    private static StepUpMode parseStepUpMode(String raw) {
        try {
            return StepUpMode.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("step_up_mode must be PERCENT or FIXED");
        }
    }

    private static void validateStepUpConfig(StepUpMode mode, double stepUpPercent, int stepUpAmount) {
        if (mode == StepUpMode.PERCENT && (stepUpPercent < 0 || stepUpPercent > 100)) {
            throw new IllegalArgumentException("step_up_percent must be between 0 and 100");
        }
        if (mode == StepUpMode.FIXED && stepUpAmount <= 0) {
            throw new IllegalArgumentException("step_up_amount must be greater than 0 for FIXED mode");
        }
    }
}
