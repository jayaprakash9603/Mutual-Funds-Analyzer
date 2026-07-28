package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record SipSimulation(SipReport.SipScenario scenario, List<SipTimelinePoint> timeline) {
}
