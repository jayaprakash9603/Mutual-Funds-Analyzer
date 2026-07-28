package in.goldentriangle.mfa.domain.model.report;

import in.goldentriangle.mfa.domain.model.NavPoint;

import java.time.Instant;
import java.util.List;

/**
 * Daily NAV history for a fund and its benchmark.
 * {@code fundNav} and {@code benchmarkNav} are sorted ascending by date with at most one point per calendar day.
 */
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
