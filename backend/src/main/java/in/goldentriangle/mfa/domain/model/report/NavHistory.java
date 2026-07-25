package in.goldentriangle.mfa.domain.model.report;

import in.goldentriangle.mfa.domain.model.NavPoint;

import java.time.Instant;
import java.util.List;

public record NavHistory(
        String scheme,
        String fundName,
        String benchmarkName,
        String category,
        String amc,
        List<NavPoint> fundNav,
        List<NavPoint> benchmarkNav,
        Instant firstNavDate,
        Instant lastNavDate,
        String startDateUsed) {
}
