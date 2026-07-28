package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record LumpsumSimulation(
        LumpsumReport.LumpsumScenario scenario,
        List<SipTimelinePoint> timeline) {
}
