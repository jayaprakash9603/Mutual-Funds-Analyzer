package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.report.CalendarYearInsightsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.AllTimeHighsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.BestDaysReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.BenchmarkComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ConsistencyDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.DrawdownReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ExpenseReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.FundMetricsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.FundProfileDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.FundReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.common.GoldenTriangleResultDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.InvestorFitDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.LumpsumReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.MatrixReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ProbabilityDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.ProsConsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.QualityScoreDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RecommendationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RiskReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.RollingReturnsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.SipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.StepUpSipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.StepUpSipSimulationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.TaxReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.report.TrailingReturnsDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpMode;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipConfig;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipSimulation;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReportBundle;
import in.goldentriangle.mfa.domain.port.in.GetFundReportSectionUseCase;
import in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase;
import in.goldentriangle.mfa.domain.port.out.FeatureFlagPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = FundReportController.class)
class FundReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GetFundReportUseCase getFundReportUseCase;

    @MockBean
    private GetFundReportSectionUseCase getFundReportSectionUseCase;

    @MockBean
    private FundReportMapper fundReportMapper;

    @MockBean
    private FeatureFlagPort featureFlagPort;

    @Test
    void getReportReturnsFundReport() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        when(getFundReportUseCase.get(eq("Test Fund"), isNull())).thenReturn(mock(FundReport.class));
        when(fundReportMapper.toDto(any(FundReport.class))).thenReturn(minimalReport("Test Fund"));

        mockMvc.perform(get("/api/fund-report").param("scheme", "Test Fund"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheme").value("Test Fund"));
    }

    @Test
    void getMatrixReturnsMatrixReport() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        when(getFundReportUseCase.getMatrix(eq("Test Fund"), isNull(), eq(MatrixMode.LUMPSUM)))
                .thenReturn(new MatrixReportBundle(
                        mock(MatrixReport.class),
                        MatrixRecoveryAnalysis.empty(),
                        Instant.now(),
                        Instant.now(),
                        false));
        when(fundReportMapper.toDto(any(MatrixReportBundle.class))).thenReturn(
                new MatrixReportDto(
                        "LUMPSUM",
                        List.of("2010"),
                        List.of(5),
                        List.of(),
                        List.of(),
                        null,
                        Instant.now(),
                        Instant.now(),
                        false));

        mockMvc.perform(get("/api/fund-report/matrix").param("scheme", "Test Fund").param("mode", "LUMPSUM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("LUMPSUM"));
    }

    @Test
    void simulateStepUpSipReturnsSimulation() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        StepUpSipConfig config = new StepUpSipConfig(10_000, 1, StepUpMode.PERCENT, 10, 0);
        when(getFundReportUseCase.simulateStepUpSip(eq("Test Fund"), isNull(), any(StepUpSipConfig.class)))
                .thenReturn(mock(StepUpSipSimulation.class));
        when(fundReportMapper.toDto(any(StepUpSipSimulation.class), any(StepUpSipConfig.class)))
                .thenReturn(new StepUpSipSimulationDto(
                        1,
                        "PERCENT",
                        10,
                        0,
                        new StepUpSipReportDto.StepUpSipScenarioDto(
                                10_000, 11_000, "PERCENT", 10, 100_000, 20_000, 12, 80_000, 120_000, 0, 0, 10, 24),
                        List.of()));

        mockMvc.perform(get("/api/fund-report/step-up-sip/simulate")
                        .param("scheme", "Test Fund")
                        .param("initial_amount", "10000")
                        .param("step_up_mode", "PERCENT")
                        .param("step_up_percent", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stepUpMode").value("PERCENT"))
                .andExpect(jsonPath("$.scenario.initialMonthlyAmount").value(10_000));
    }

    private static FundReportDto minimalReport(String scheme) {
        var metrics = new FundMetricsDto(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "Moderate", 0, 0);
        var golden = new GoldenTriangleResultDto(List.of(), 0, "Moderate", false, metrics, scheme, "Index", "Equity", "5 Year");
        var profile = new FundProfileDto(
                scheme, "", "Equity", "Index", null, null, null, 10, null, null, null, null, null,
                100, null, null, "Moderate", 3, Instant.parse("2010-01-01T00:00:00Z"), Instant.now());
        var emptyRisk = new RiskReportDto(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "Moderate");
        var emptyBestDays = new BestDaysReportDto(
                1_000_000, "", List.of(), List.of(), List.of(), List.of(),
                new BestDaysReportDto.BestWorstProximityInsightDto(0, 10, 30, ""), "");
        var emptyCalendarInsights = new CalendarYearInsightsReportDto(
                new CalendarYearInsightsReportDto.AnnualReturnDistributionDto(
                        List.of(), 0, 0, 0, 0, 0, ""),
                new CalendarYearInsightsReportDto.SortedCalendarReturnsDto(
                        "", 0, 0, 10, 15, List.of(), ""),
                new CalendarYearInsightsReportDto.ProfitBookingComparisonDto(
                        10, 6, List.of(), "", ""));
        var emptyAllTimeHighs = new AllTimeHighsReportDto(
                "", List.of(), List.of(),
                new AllTimeHighsReportDto.AllTimeHighsSummaryDto(0, 0, 0, 0, ""),
                new AllTimeHighsReportDto.PostAthReturnsDto(List.of(), ""),
                new AllTimeHighsReportDto.AthDeclineOutlookDto(10, 0, 0, 0, 0, 0, ""));
        return new FundReportDto(
                scheme,
                profile,
                golden,
                new TrailingReturnsDto(List.of()),
                new RollingReturnsReportDto(List.of(), 0),
                emptyCalendarInsights,
                new BenchmarkComparisonDto(0, 0, 0, false, 0, 0, ""),
                new ProbabilityDto(0, 0, 0, 0, 0, 0),
                emptyRisk,
                new ConsistencyDto(List.of(), List.of(), 0, 0, 0, 0, 0, 0, "Moderate"),
                new DrawdownReportDto(0, 0, 0, 0, 0, List.of(), List.of(), List.of(), List.of(), List.of(), List.of()),
                emptyBestDays,
                emptyAllTimeHighs,
                new SipReportDto(1, 10_000, List.of(), List.of()),
                new LumpsumReportDto(100_000, List.of(), List.of()),
                new TaxReportDto(0, 0, 0, 0, ""),
                new ExpenseReportDto(null, null, null, null, ""),
                new QualityScoreDto(50, List.of()),
                List.of(),
                new ProsConsDto(List.of(), List.of()),
                new InvestorFitDto(List.of(), List.of()),
                new RecommendationDto("Hold", 50, "Summary"),
                Instant.now());
    }
}
