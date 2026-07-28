package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.testsupport.NavPointSeedGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.profiles.active=jpa",
        "features.upstream.host=analysis.investt.in",
        "features.upstream.basePath=/mutual-funds-research",
        "features.upstream.timeout=60s",
        "features.upstream.defaultStartDate=01-01-2013",
        "features.mfapi.host=api.mfapi.in",
        "features.mfapi.timeout=20s",
        "features.mfapi.navTtl=6h",
        "spring.jpa.properties.hibernate.generate_statistics=true"
})
@ActiveProfiles("jpa")
class NavStorePerformanceIT {

    private static final int SCHEME_COUNT = 10;
    private static final int POINTS_PER_SERIES = 5_000;

    @Autowired
    private JpaNavStore navStore;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void batchUpsertAndRangeLoadAtScale() {
        for (int schemeCode = 1; schemeCode <= SCHEME_COUNT; schemeCode++) {
            navStore.append(schemeCode, NavSeries.FUND, NavPointSeedGenerator.seriesForScheme(schemeCode, NavSeries.FUND, POINTS_PER_SERIES));
            navStore.append(schemeCode, NavSeries.BENCHMARK, NavPointSeedGenerator.seriesForScheme(schemeCode, NavSeries.BENCHMARK, POINTS_PER_SERIES));
        }

        Long totalRows = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM nav_point", Long.class);
        assertTrue(totalRows >= NavPointSeedGenerator.totalRows(SCHEME_COUNT, POINTS_PER_SERIES));

        Instant from = LocalDate.of(2015, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant();
        List<?> loaded = navStore.loadPoints(1, NavSeries.FUND, from);
        assertFalse(loaded.isEmpty());

        List<String> plan = jdbcTemplate.queryForList(
                """
                        EXPLAIN SELECT nav_date, nav
                        FROM nav_point
                        WHERE scheme_code = ? AND series = ? AND nav_date >= ?
                        ORDER BY nav_date ASC
                        """,
                String.class,
                1,
                NavSeries.FUND.name(),
                LocalDate.of(2015, 1, 1));
        String planText = String.join("\n", plan).toUpperCase(Locale.ROOT);
        assertTrue(planText.contains("NAV_POINT"), planText);
        assertEquals(loaded.size(), navStore.loadPoints(1, NavSeries.FUND, from).size());
    }
}
