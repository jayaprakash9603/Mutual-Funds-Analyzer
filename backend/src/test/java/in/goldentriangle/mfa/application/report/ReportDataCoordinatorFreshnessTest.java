package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.domain.model.NavFreshness;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReportDataCoordinatorFreshnessTest {

    private static final Instant STORED = Instant.parse("2026-07-24T00:00:00Z");

    @Test
    void watermarkMatchesWhenNavIsLiveAndDatesAlign() {
        NavFreshness nav = new NavFreshness(Optional.of(STORED), false);

        assertTrue(ReportDataCoordinator.watermarkMatches(STORED, nav));
    }

    @Test
    void watermarkMismatchWhenUpstreamCheckIsDue() {
        NavFreshness nav = new NavFreshness(Optional.of(STORED), true);

        assertFalse(ReportDataCoordinator.watermarkMatches(STORED, nav));
    }
}
