package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.model.NavPoint;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public final class SipScheduleBuilder {

    private SipScheduleBuilder() {
    }

    /** Calendar-day SIP: same day each month (1–28), using nearest NAV within 7 days. */
    public static List<SipInstalment> build(List<NavPoint> nav, Instant end, int scheduleDay) {
        int day = SipCalculator.clampScheduleDay(scheduleDay);
        YearMonth cursor = YearMonth.from(nav.get(0).date().atZone(ZoneOffset.UTC));
        YearMonth endMonth = YearMonth.from(end.atZone(ZoneOffset.UTC));
        List<SipInstalment> schedule = new ArrayList<>();

        while (!cursor.isAfter(endMonth)) {
            int dom = Math.min(day, cursor.lengthOfMonth());
            Instant target = cursor.atDay(dom).atStartOfDay(ZoneOffset.UTC).toInstant();
            if (target.isAfter(end)) {
                break;
            }
            Optional<NavPoint> point = NavLookup.nearest(nav, target);
            if (point.isPresent() && point.get().nav() > 0) {
                schedule.add(new SipInstalment(point.get().date(), point.get().nav()));
            }
            cursor = cursor.plusMonths(1);
        }
        return schedule;
    }
}
