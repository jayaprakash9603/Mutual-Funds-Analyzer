package in.goldentriangle.mfa.domain.analytics;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class NavDateParser {

    private static final Pattern PREFIX = Pattern.compile("^([A-Za-z]+ \\d+, \\d+)");
    /** Upstream often sends "Jan 1, 2014, 12:00:00 AM" (abbrev) and sometimes full month names. */
    private static final DateTimeFormatter SHORT_MONTH =
            DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter LONG_MONTH =
            DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH);

    private NavDateParser() {
    }

    /**
     * Returns empty rather than a fallback date when the input cannot be parsed. Callers must skip
     * such rows: substituting "now" would make a row look newer than any watermark and would push
     * the watermark forward past real data.
     */
    public static Optional<Instant> parse(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return Optional.empty();
        }
        Matcher matcher = PREFIX.matcher(dateStr);
        if (matcher.find()) {
            String prefix = matcher.group(1);
            Optional<Instant> prefixed = fromLocalDate(prefix, SHORT_MONTH)
                    .or(() -> fromLocalDate(prefix, LONG_MONTH));
            if (prefixed.isPresent()) {
                return prefixed;
            }
        }
        return fromInstant(dateStr)
                .or(() -> fromLocalDate(dateStr, DateTimeFormatter.ISO_LOCAL_DATE))
                .or(() -> fromLocalDate(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy", Locale.ENGLISH)))
                .or(() -> fromLocalDate(dateStr, SHORT_MONTH))
                .or(() -> fromLocalDate(dateStr, LONG_MONTH));
    }

    public static String dateKey(Instant instant) {
        return instant.atZone(ZoneOffset.UTC).toLocalDate().toString();
    }

    private static Optional<Instant> fromInstant(String value) {
        try {
            return Optional.of(Instant.parse(value));
        } catch (DateTimeParseException ex) {
            return Optional.empty();
        }
    }

    private static Optional<Instant> fromLocalDate(String value, DateTimeFormatter formatter) {
        try {
            return Optional.of(LocalDate.parse(value, formatter).atStartOfDay(ZoneOffset.UTC).toInstant());
        } catch (DateTimeParseException ex) {
            return Optional.empty();
        }
    }
}
