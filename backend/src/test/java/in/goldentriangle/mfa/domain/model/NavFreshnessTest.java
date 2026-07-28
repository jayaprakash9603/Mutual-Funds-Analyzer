package in.goldentriangle.mfa.domain.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NavFreshnessTest {

    private static final Instant WATERMARK = Instant.parse("2026-07-24T00:00:00Z");

    @Test
    void matchingWatermarkWithLiveNavIsFresh() {
        NavFreshness freshness = new NavFreshness(Optional.of(WATERMARK), false);

        assertTrue(freshness.matchesSnapshot(WATERMARK));
    }

    @Test
    void expiredNavTtlForcesStaleEvenWhenWatermarkMatches() {
        NavFreshness freshness = new NavFreshness(Optional.of(WATERMARK), true);

        assertFalse(freshness.matchesSnapshot(WATERMARK));
    }

    @Test
    void missingStoredWatermarkIsStale() {
        NavFreshness freshness = new NavFreshness(Optional.of(WATERMARK), false);

        assertFalse(freshness.matchesSnapshot(null));
    }

    @Test
    void missingNavWatermarkTreatsMatchingStoredDateAsFreshWhenNotDue() {
        NavFreshness freshness = new NavFreshness(Optional.empty(), false);

        assertTrue(freshness.matchesSnapshot(WATERMARK));
    }

    @Test
    void mismatchedWatermarkIsStale() {
        NavFreshness freshness = new NavFreshness(
                Optional.of(Instant.parse("2026-07-27T00:00:00Z")),
                false);

        assertFalse(freshness.matchesSnapshot(WATERMARK));
    }
}
