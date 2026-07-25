package in.goldentriangle.mfa.domain.model;

import java.time.Instant;
import java.util.List;

public record FundAnalysis(
        String scheme,
        Period period,
        GoldenTriangleResult result,
        List<String> insights,
        List<TimelineEvent> timeline,
        Instant analysedAt
) {
}
