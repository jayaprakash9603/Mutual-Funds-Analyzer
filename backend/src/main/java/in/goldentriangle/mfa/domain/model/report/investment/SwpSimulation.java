package in.goldentriangle.mfa.domain.model.report.investment;

import java.util.List;

public record SwpSimulation(SwpReport.SwpScenario scenario, List<SwpTimelinePoint> timeline) {
}
