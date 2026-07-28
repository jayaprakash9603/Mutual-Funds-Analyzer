package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;

import java.time.Instant;

public record SipInstalment(Instant date, double nav) {

    double heldYearsUntil(Instant end) {
        return CalendarMath.yearsBetweenMillis(date.toEpochMilli(), end.toEpochMilli());
    }
}
