package in.goldentriangle.mfa.domain.analytics;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NavDateParserTest {

    @Test
    void parsesAbbreviatedMonthWithTimeSuffix() {
        var parsed = NavDateParser.parse("Jan 1, 2014, 12:00:00 AM");
        assertTrue(parsed.isPresent());
        assertEquals(
                LocalDate.of(2014, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant(),
                parsed.get());
    }

    @Test
    void parsesFullMonthWithTimeSuffix() {
        var parsed = NavDateParser.parse("May 21, 2013, 12:00:00 AM");
        assertTrue(parsed.isPresent());
        assertEquals(
                LocalDate.of(2013, 5, 21).atStartOfDay(ZoneOffset.UTC).toInstant(),
                parsed.get());
    }

    @Test
    void parsesJunAbbreviation() {
        var parsed = NavDateParser.parse("Jun 3, 2013, 12:00:00 AM");
        assertTrue(parsed.isPresent());
        assertEquals(
                LocalDate.of(2013, 6, 3).atStartOfDay(ZoneOffset.UTC).toInstant(),
                parsed.get());
    }
}
