package in.goldentriangle.mfa.domain.analytics;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Heuristic for the latest mutual-fund NAV date consumers should expect.
 * NAV for day D is typically published on the next Indian business morning.
 */
public final class NavPublicationCalendar {

    static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private NavPublicationCalendar() {
    }

    public static LocalDate latestExpectedNavDate(Clock clock) {
        LocalDate date = clock.instant().atZone(INDIA).toLocalDate().minusDays(1);
        while (isWeekend(date)) {
            date = date.minusDays(1);
        }
        return date;
    }

    public static boolean isWatermarkBehind(Instant watermarkNavDate, Clock clock) {
        if (watermarkNavDate == null) {
            return true;
        }
        LocalDate watermark = watermarkNavDate.atZone(ZoneOffset.UTC).toLocalDate();
        return watermark.isBefore(latestExpectedNavDate(clock));
    }

    private static boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }
}
