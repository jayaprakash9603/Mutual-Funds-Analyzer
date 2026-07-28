package in.goldentriangle.mfa.domain.analytics;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NavPublicationCalendarTest {

    private static Clock clockAt(String instantIso) {
        return Clock.fixed(Instant.parse(instantIso), ZoneId.of("Asia/Kolkata"));
    }

    @Test
    void latestExpectedNavDateOnTuesdayMorningIsPreviousWeekday() {
        Clock clock = clockAt("2026-07-28T04:30:00Z");

        assertEquals(
                java.time.LocalDate.of(2026, 7, 27),
                NavPublicationCalendar.latestExpectedNavDate(clock));
    }

    @Test
    void latestExpectedNavDateOnMondayMorningIsPreviousFriday() {
        Clock clock = clockAt("2026-07-27T04:30:00Z");

        assertEquals(
                java.time.LocalDate.of(2026, 7, 24),
                NavPublicationCalendar.latestExpectedNavDate(clock));
    }

    @Test
    void watermarkFourDaysOldIsBehindOnTuesday() {
        Clock clock = clockAt("2026-07-28T10:00:00+05:30");
        Instant watermark = Instant.parse("2026-07-24T00:00:00Z");

        assertTrue(NavPublicationCalendar.isWatermarkBehind(watermark, clock));
    }

    @Test
    void watermarkOnExpectedDateIsNotBehind() {
        Clock clock = clockAt("2026-07-28T10:00:00+05:30");
        Instant watermark = Instant.parse("2026-07-27T00:00:00Z");

        assertFalse(NavPublicationCalendar.isWatermarkBehind(watermark, clock));
    }
}
