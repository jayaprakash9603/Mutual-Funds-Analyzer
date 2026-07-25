package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.analytics.report.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.NavHistory;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
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
        if (nav.isEmpty()) {
            return rows;
        }

        int endScan = 0;
        for (NavPoint start : nav) {
            Instant targetEnd = start.date().atZone(ZoneOffset.UTC).plusYears(period.years()).toInstant();
            Instant windowStart = targetEnd.minus(TOLERANCE_DAYS, ChronoUnit.DAYS);
            Instant windowEnd = targetEnd.plus(TOLERANCE_DAYS, ChronoUnit.DAYS);

            while (endScan < nav.size() && nav.get(endScan).date().isBefore(windowStart)) {
                endScan++;
            }
            if (endScan >= nav.size()) {
                break;
            }

            NavPoint bestEnd = null;
            long bestDiff = Long.MAX_VALUE;
            for (int i = endScan; i < nav.size() && !nav.get(i).date().isAfter(windowEnd); i++) {
                long diff = Math.abs(ChronoUnit.DAYS.between(nav.get(i).date(), targetEnd));
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestEnd = nav.get(i);
                }
            }
            if (bestEnd == null || bestDiff > TOLERANCE_DAYS) {
                continue;
            }
            if (!bestEnd.date().isAfter(start.date()) || start.nav() <= 0 || bestEnd.nav() <= 0) {
                continue;
            }

            double years = CalendarMath.yearsBetweenMillis(
                    start.date().toEpochMilli(), bestEnd.date().toEpochMilli());
            if (years <= 0) {
                continue;
            }
            double rolling = period.years() == 1
                    ? CalendarMath.absoluteReturn(start.nav(), bestEnd.nav())
                    : CalendarMath.cagr(start.nav(), bestEnd.nav(), years);
            rows.add(new RollingReturnRow(
                    id.getAndIncrement(),
                    history.amc(),
                    history.category(),
                    history.fundName(),
                    period.label(),
                    NavDateFormatter.toUpstreamDate(start.date()),
                    start.nav(),
                    NavDateFormatter.toUpstreamDate(bestEnd.date()),
                    bestEnd.nav(),
                    rolling));
        }
        return rows;
    }
}
