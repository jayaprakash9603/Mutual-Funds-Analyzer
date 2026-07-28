package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.NavPoint;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NavSeriesOrderTest {

    @Test
    void detectsSortedUniqueSeries() {
        List<NavPoint> series = List.of(
                new NavPoint(Instant.parse("2020-01-01T00:00:00Z"), 10),
                new NavPoint(Instant.parse("2020-01-02T00:00:00Z"), 11));
        assertTrue(NavSeriesOrder.isSortedUnique(series));
        assertEquals(series, NavSeriesOrder.dedupeAndSort(series));
    }

    @Test
    void dedupesAndSortsUnorderedInput() {
        List<NavPoint> input = List.of(
                new NavPoint(Instant.parse("2020-01-02T00:00:00Z"), 11),
                new NavPoint(Instant.parse("2020-01-01T00:00:00Z"), 10),
                new NavPoint(Instant.parse("2020-01-01T00:00:00Z"), 99));
        List<NavPoint> sorted = NavSeriesOrder.dedupeAndSort(input);
        assertEquals(2, sorted.size());
        assertEquals(99, sorted.get(0).nav());
        assertEquals(11, sorted.get(1).nav());
    }
}
