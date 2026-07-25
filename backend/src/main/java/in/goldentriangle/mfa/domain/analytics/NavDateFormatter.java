package in.goldentriangle.mfa.domain.analytics;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public final class NavDateFormatter {

    private static final DateTimeFormatter UPSTREAM = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private NavDateFormatter() {
    }

    public static String toUpstreamDate(Instant instant) {
        return instant.atZone(ZoneOffset.UTC).toLocalDate().format(UPSTREAM);
    }

    public static String dayAfter(Instant instant) {
        return instant.atZone(ZoneOffset.UTC).toLocalDate().plusDays(1).format(UPSTREAM);
    }
}
