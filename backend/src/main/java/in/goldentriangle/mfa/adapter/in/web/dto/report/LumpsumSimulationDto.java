package in.goldentriangle.mfa.adapter.in.web.dto.report;

public record LumpsumSimulationDto(
        LumpsumReportDto.LumpsumScenarioDto scenario,
        java.util.List<SipTimelinePointDto> timeline) {
}
