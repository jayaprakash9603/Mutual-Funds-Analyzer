package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record StepUpSipSimulationDto(
        int scheduleDay,
        String stepUpMode,
        double stepUpPercent,
        int stepUpAmount,
        StepUpSipReportDto.StepUpSipScenarioDto scenario,
        List<SipTimelinePointDto> timeline) {
}
