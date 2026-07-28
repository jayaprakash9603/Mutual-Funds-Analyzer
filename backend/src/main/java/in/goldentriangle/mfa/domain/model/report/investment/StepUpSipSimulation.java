package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record StepUpSipSimulation(StepUpSipReport.StepUpSipScenario scenario, List<SipTimelinePoint> timeline) {
}
