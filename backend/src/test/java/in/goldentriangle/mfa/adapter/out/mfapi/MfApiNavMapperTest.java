package in.goldentriangle.mfa.adapter.out.mfapi;

import in.goldentriangle.mfa.domain.model.NavPoint;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MfApiNavMapperTest {

    @Test
    void parsesNewestFirstNavRowsIntoAscendingSeries() {
        List<Map<String, Object>> data = List.of(
                Map.of("date", "02-01-2020", "nav", "12.5"),
                Map.of("date", "01-01-2020", "nav", "10.0"));

        List<NavPoint> points = MfApiNavMapper.parseNavPoints(data);

        assertEquals(2, points.size());
        assertEquals(LocalDate.of(2020, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant(), points.get(0).date());
        assertEquals(10.0, points.get(0).nav(), 0.001);
        assertEquals(LocalDate.of(2020, 1, 2).atStartOfDay(ZoneOffset.UTC).toInstant(), points.get(1).date());
        assertEquals(12.5, points.get(1).nav(), 0.001);
    }

    @Test
    void convertsFlexibleStartDatesToIsoForQueryParams() {
        assertEquals("2013-01-01", MfApiNavMapper.toApiStartDate("01-01-2013"));
        assertEquals("2013-01-01", MfApiNavMapper.toApiStartDate("2013-01-01"));
    }

    @Test
    void parsesMetaFields() {
        MfApiNavMapper.MfApiMeta meta = MfApiNavMapper.parseMeta(Map.of(
                "fund_house", "Test AMC",
                "scheme_category", "Equity",
                "scheme_code", 123456,
                "scheme_name", "Test Fund - Direct Plan"));

        assertEquals("Test AMC", meta.fundHouse());
        assertEquals("Equity", meta.schemeCategory());
        assertEquals(123456, meta.schemeCode());
        assertEquals("Test Fund - Direct Plan", meta.schemeName());
    }

    @Test
    void parseDateSupportsMfapiFormat() {
        Instant parsed = MfApiNavMapper.parseDate("15-06-2021").orElseThrow();
        assertEquals(LocalDate.of(2021, 6, 15).atStartOfDay(ZoneOffset.UTC).toInstant(), parsed);
        assertTrue(MfApiNavMapper.parseDate("2021-06-15").isPresent());
    }
}
