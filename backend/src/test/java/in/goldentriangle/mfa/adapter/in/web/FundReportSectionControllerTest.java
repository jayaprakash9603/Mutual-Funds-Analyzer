package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportAssessmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportInvestmentDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportOverviewDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportPerformanceDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.FundReportRiskDto;
import in.goldentriangle.mfa.adapter.in.web.dto.section.ReportSectionEnvelopeDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.domain.model.ReportFreshness;
import in.goldentriangle.mfa.domain.model.ReportSectionEnvelope;
import in.goldentriangle.mfa.domain.model.report.section.FundReportAssessmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportInvestmentSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportOverviewSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportPerformanceSection;
import in.goldentriangle.mfa.domain.model.report.section.FundReportRiskSection;
import in.goldentriangle.mfa.domain.port.in.GetFundReportSectionUseCase;
import in.goldentriangle.mfa.domain.port.out.FeatureFlagPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = FundReportController.class)
class FundReportSectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GetFundReportSectionUseCase getFundReportSectionUseCase;

    @MockBean
    private in.goldentriangle.mfa.domain.port.in.GetFundReportUseCase getFundReportUseCase;

    @MockBean
    private FundReportMapper fundReportMapper;

    @MockBean
    private FeatureFlagPort featureFlagPort;

    private static final Instant WATERMARK = Instant.parse("2026-01-01T00:00:00Z");
    private static final Instant COMPUTED = Instant.parse("2026-01-02T00:00:00Z");

    @Test
    void getOverviewReturnsEnvelope() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        when(getFundReportSectionUseCase.getOverview(eq("Test Fund"), isNull()))
                .thenReturn(new ReportSectionEnvelope<>(
                        new FundReportOverviewSection("Test Fund", null),
                        ReportFreshness.FRESH,
                        WATERMARK,
                        COMPUTED,
                        3));
        when(fundReportMapper.toOverviewDto(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new ReportSectionEnvelopeDto<>(
                        new FundReportOverviewDto("Test Fund", null),
                        "FRESH",
                        WATERMARK,
                        COMPUTED,
                        3));

        mockMvc.perform(get("/api/fund-report/overview").param("scheme", "Test Fund"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scheme").value("Test Fund"))
                .andExpect(jsonPath("$.freshness").value("FRESH"))
                .andExpect(jsonPath("$.schemaVersion").value(3));
    }

    @Test
    void getPerformanceReturnsEnvelope() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        when(getFundReportSectionUseCase.getPerformance(eq("Test Fund"), isNull()))
                .thenReturn(new ReportSectionEnvelope<>(
                        new FundReportPerformanceSection(null, null, null, null, null, null),
                        ReportFreshness.FRESH,
                        WATERMARK,
                        COMPUTED,
                        3));
        when(fundReportMapper.toPerformanceDto(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new ReportSectionEnvelopeDto<>(
                        new FundReportPerformanceDto(null, null, null, null, null, null),
                        "FRESH",
                        WATERMARK,
                        COMPUTED,
                        3));

        mockMvc.perform(get("/api/fund-report/performance").param("scheme", "Test Fund"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.freshness").value("FRESH"));
    }

    @Test
    void getRiskReturnsEnvelope() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        when(getFundReportSectionUseCase.getRisk(eq("Test Fund"), isNull()))
                .thenReturn(new ReportSectionEnvelope<>(
                        new FundReportRiskSection(null, null, null, null, null, null),
                        ReportFreshness.STALE,
                        WATERMARK,
                        COMPUTED,
                        3));
        when(fundReportMapper.toRiskDto(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new ReportSectionEnvelopeDto<>(
                        new FundReportRiskDto(null, null, null, null, null, null),
                        "STALE",
                        WATERMARK,
                        COMPUTED,
                        3));

        mockMvc.perform(get("/api/fund-report/risk").param("scheme", "Test Fund"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.freshness").value("STALE"));
    }

    @Test
    void getInvestmentReturnsEnvelope() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        when(getFundReportSectionUseCase.getInvestment(eq("Test Fund"), isNull()))
                .thenReturn(new ReportSectionEnvelope<>(
                        new FundReportInvestmentSection(null, null, null, null, null),
                        ReportFreshness.FRESH,
                        WATERMARK,
                        COMPUTED,
                        3));
        when(fundReportMapper.toInvestmentDto(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new ReportSectionEnvelopeDto<>(
                        new FundReportInvestmentDto(null, null, null, null, null),
                        "FRESH",
                        WATERMARK,
                        COMPUTED,
                        3));

        mockMvc.perform(get("/api/fund-report/investment").param("scheme", "Test Fund"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.freshness").value("FRESH"));
    }

    @Test
    void getAssessmentReturnsEnvelope() throws Exception {
        when(featureFlagPort.allFlags()).thenReturn(Map.of("analysis.fundReport", true));
        when(getFundReportSectionUseCase.getAssessment(eq("Test Fund"), isNull()))
                .thenReturn(new ReportSectionEnvelope<>(
                        new FundReportAssessmentSection(null, null, List.of(), null, null, null),
                        ReportFreshness.REFRESHING,
                        WATERMARK,
                        COMPUTED,
                        3));
        when(fundReportMapper.toAssessmentDto(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new ReportSectionEnvelopeDto<>(
                        new FundReportAssessmentDto(null, null, List.of(), null, null, null),
                        "REFRESHING",
                        WATERMARK,
                        COMPUTED,
                        3));

        mockMvc.perform(get("/api/fund-report/assessment").param("scheme", "Test Fund"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.freshness").value("REFRESHING"));
    }
}
