package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.analytics.report.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.report.NavLookup;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.NavHistory;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

public class RollingReturnsFromNav {

    private static final int TOLERANCE_DAYS = 7;

    public RollingReturnsData compute(NavHistory history) {
        List<RollingReturnRow> fundRows = new ArrayList<>();
        AtomicLong id = new AtomicLong(1);
        for (Period period : Period.values()) {
            fundRows.addAll(computePeriod(history, period, id));
        }
        return new RollingReturnsData(List.copyOf(fundRows), List.of());
    }

    private List<RollingReturnRow> computePeriod(NavHistory history, Period period, AtomicLong id) {
        List<RollingReturnRow> rows = new ArrayList<>();
        List<NavPoint> nav = history.fundNav();
        for (NavPoint start : nav) {
            Instant targetEnd = start.date().atZone(ZoneOffset.UTC).plusYears(period.years()).toInstant();
            NavLookup.nearest(nav, targetEnd, TOLERANCE_DAYS).ifPresent(end -> {
                if (!end.date().isAfter(start.date()) || start.nav() <= 0 || end.nav() <= 0) {
                    return;
                }
                double years = CalendarMath.yearsBetweenMillis(
                        start.date().toEpochMilli(), end.date().toEpochMilli());
                if (years <= 0) {
                    return;
                }
                double rolling = period.years() == 1
                        ? CalendarMath.absoluteReturn(start.nav(), end.nav())
                        : CalendarMath.cagr(start.nav(), end.nav(), years);
                rows.add(new RollingReturnRow(
                        id.getAndIncrement(),
                        history.amc(),
                        history.category(),
                        history.fundName(),
                        period.label(),
                        NavDateFormatter.toUpstreamDate(start.date()),
                        start.nav(),
                        NavDateFormatter.toUpstreamDate(end.date()),
                        end.nav(),
                        rolling));
            });
        }
        return rows;
    }
}
