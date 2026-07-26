package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.BenchmarkComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ConsistencyDto;
import in.goldentriangle.mfa.adapter.in.web.dto.DrawdownReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ExpenseReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.FundMetricsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.FundProfileDto;
import in.goldentriangle.mfa.adapter.in.web.dto.FundReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.GoldenTriangleResultDto;
import in.goldentriangle.mfa.adapter.in.web.dto.InvestorFitDto;
import in.goldentriangle.mfa.adapter.in.web.dto.LumpsumReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.MatrixReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ProbabilityDto;
import in.goldentriangle.mfa.adapter.in.web.dto.ProsConsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.QualityScoreDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RecommendationDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RiskReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RollingReturnsReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.SipReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.TaxReportDto;
import in.goldentriangle.mfa.adapter.in.web.dto.TrailingReturnsDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.MatrixReportBundle;
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

    private static FundReportDto minimalReport(String scheme) {
        var metrics = new FundMetricsDto(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "Moderate", 0, 0);
        var golden = new GoldenTriangleResultDto(List.of(), 0, "Moderate", false, metrics, scheme, "Index", "Equity", "5 Year");
        var profile = new FundProfileDto(
                scheme, "", "Equity", "Index", null, null, null, 10, null, null, null, null, null,
                100, null, null, "Moderate", 3, Instant.parse("2010-01-01T00:00:00Z"), Instant.now());
        var emptyRisk = new RiskReportDto(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "Moderate");
        return new FundReportDto(
                scheme,
                profile,
                golden,
                new TrailingReturnsDto(List.of()),
                new RollingReturnsReportDto(List.of(), 0),
                new BenchmarkComparisonDto(0, 0, 0, false, 0, 0, ""),
                new ProbabilityDto(0, 0, 0, 0, 0, 0),
                emptyRisk,
                new ConsistencyDto(List.of(), List.of(), 0, 0, 0, 0, 0, 0, "Moderate"),
                new DrawdownReportDto(0, 0, 0, 0, 0, List.of(), List.of()),
                new SipReportDto(List.of()),
                new LumpsumReportDto(List.of()),
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
