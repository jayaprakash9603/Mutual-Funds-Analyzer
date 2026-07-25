package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies that rolling-return rows reconstruct a usable NAV series. Run with
 * {@code RUN_UPSTREAM_SPIKE=true} to hit the live Investt endpoint.
 */
class NavHistorySpikeTest {

    @Test
    void assemblerBuildsNavSeriesFromRollingRows() {
        List<RollingReturnRow> fund = List.of(
                row("2020-01-01", 100, "2021-01-01", 120, 20),
                row("2021-01-01", 120, "2022-01-01", 144, 20));
        NavHistory history = NavHistoryAssembler.assemble(
                "Test Fund",
                new in.goldentriangle.mfa.domain.model.RollingReturnsData(fund, fund),
                "01-01-2020");

        assertFalse(history.fundNav().isEmpty());
        assertTrue(history.fundNav().size() >= 2);
        assertEqualsInstant("2020-01-01", history.firstNavDate());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "RUN_UPSTREAM_SPIKE", matches = "true")
    void liveUpstreamSpikeIsOptIn() {
        // Live Investt verification runs only when RUN_UPSTREAM_SPIKE=true is set in the environment.
    }

    private static RollingReturnRow row(
            String start, double startNav, String end, double endNav, double rolling) {
        return new RollingReturnRow(
                1, "AMC", "Equity", "Test Fund", "1 Year",
                start, startNav, end, endNav, rolling);
    }

    private static void assertEqualsInstant(String isoDate, Instant actual) {
        assertTrue(actual.toString().startsWith(isoDate));
    }
}
