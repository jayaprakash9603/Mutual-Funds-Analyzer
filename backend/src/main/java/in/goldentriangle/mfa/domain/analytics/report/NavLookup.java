package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.NavPoint;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

public final class NavLookup {

    private static final int DEFAULT_TOLERANCE_DAYS = 7;

    private NavLookup() {
    }

    public static Optional<NavPoint> navOnOrBefore(List<NavPoint> series, Instant target) {
        if (series.isEmpty()) {
            return Optional.empty();
        }
        int lo = 0;
        int hi = series.size() - 1;
        int best = -1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            Instant midDate = series.get(mid).date();
            if (!midDate.isAfter(target)) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return best >= 0 ? Optional.of(series.get(best)) : Optional.empty();
    }

    public static Optional<NavPoint> navOnOrAfter(List<NavPoint> series, Instant target) {
        if (series.isEmpty()) {
            return Optional.empty();
        }
        int lo = 0;
        int hi = series.size() - 1;
        int best = -1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            Instant midDate = series.get(mid).date();
            if (!midDate.isBefore(target)) {
                best = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }
        return best >= 0 ? Optional.of(series.get(best)) : Optional.empty();
    }

    public static Optional<NavPoint> nearest(List<NavPoint> series, Instant target, int toleranceDays) {
        Optional<NavPoint> before = navOnOrBefore(series, target);
        Optional<NavPoint> after = navOnOrAfter(series, target);
        if (before.isEmpty()) {
            return withinTolerance(after, target, toleranceDays);
        }
        if (after.isEmpty()) {
            return withinTolerance(before, target, toleranceDays);
        }
        long beforeDiff = Math.abs(ChronoUnit.DAYS.between(before.get().date(), target));
        long afterDiff = Math.abs(ChronoUnit.DAYS.between(after.get().date(), target));
        Optional<NavPoint> chosen = beforeDiff <= afterDiff ? before : after;
        return withinTolerance(chosen, target, toleranceDays);
    }

    public static Optional<NavPoint> nearest(List<NavPoint> series, Instant target) {
        return nearest(series, target, DEFAULT_TOLERANCE_DAYS);
    }

    private static Optional<NavPoint> withinTolerance(Optional<NavPoint> point, Instant target, int toleranceDays) {
        if (point.isEmpty()) {
            return Optional.empty();
        }
        long days = Math.abs(ChronoUnit.DAYS.between(point.get().date(), target));
        return days <= toleranceDays ? point : Optional.empty();
    }
}
