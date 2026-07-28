package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record SipSimulationDto(
        int scheduleDay,
        SipReportDto.SipScenarioDto scenario,
        List<SipTimelinePointDto> timeline) {
}
