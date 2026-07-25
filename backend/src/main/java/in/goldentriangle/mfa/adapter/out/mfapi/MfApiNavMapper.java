package in.goldentriangle.mfa.adapter.out.mfapi;

import in.goldentriangle.mfa.domain.model.NavPoint;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class MfApiNavMapper {

    private static final DateTimeFormatter MFAPI_DATE = DateTimeFormatter.ofPattern("dd-MM-yyyy", Locale.ENGLISH);

    private MfApiNavMapper() {
    }

    public record MfApiMeta(
            String fundHouse,
            String schemeCategory,
            int schemeCode,
            String schemeName) {
    }

    public static MfApiMeta parseMeta(Map<String, Object> meta) {
        return new MfApiMeta(
                string(meta.get("fund_house")),
                string(meta.get("scheme_category")),
                intValue(meta.get("scheme_code")),
                string(meta.get("scheme_name")));
    }

    public static List<NavPoint> parseNavPoints(List<Map<String, Object>> data) {
        List<NavPoint> points = new ArrayList<>();
        for (Map<String, Object> row : data) {
            String dateStr = string(row.get("date"));
            String navStr = string(row.get("nav"));
            if (dateStr.isBlank() || navStr.isBlank()) {
                continue;
            }
            parseDate(dateStr).ifPresent(date -> points.add(new NavPoint(date, Double.parseDouble(navStr))));
        }
        points.sort(Comparator.comparing(NavPoint::date));
        return points;
    }

    /** Convert dd-MM-yyyy or yyyy-MM-dd to ISO yyyy-MM-dd for mfapi query params. */
    public static String toApiStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return "1995-01-01";
        }
        return parseFlexible(startDate)
                .map(d -> d.atZone(ZoneOffset.UTC).toLocalDate().toString())
                .orElse("1995-01-01");
    }

    public static java.util.Optional<Instant> parseDate(String value) {
        return parseFlexible(value);
    }

    private static java.util.Optional<Instant> parseFlexible(String value) {
        try {
            return java.util.Optional.of(
                    LocalDate.parse(value, MFAPI_DATE).atStartOfDay(ZoneOffset.UTC).toInstant());
        } catch (DateTimeParseException ignored) {
        }
        try {
            return java.util.Optional.of(
                    LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay(ZoneOffset.UTC).toInstant());
        } catch (DateTimeParseException ignored) {
        }
        return java.util.Optional.empty();
    }

    private static String string(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static int intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(string(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
