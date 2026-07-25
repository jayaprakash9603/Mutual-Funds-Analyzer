package in.goldentriangle.mfa.domain.model;

import in.goldentriangle.mfa.domain.analytics.AggregateFolder;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RollingAggregateTest {

    @Test
    void singlePassMatchesStatistics() {
        List<Double> values = List.of(2.0, 4.0, 4.0, 4.0);
        WelfordAccumulator acc = WelfordAccumulator.empty();
        values.forEach(acc::add);

        assertEquals(Statistics.mean(values), acc.mean(), 1e-9);
        assertEquals(Statistics.stdDev(values), acc.stdDev(), 1e-9);
        assertEquals(4, acc.count());
    }

    @Test
    void chunkedFoldMatchesSinglePass() {
        List<Double> values = List.of(12.0, 15.0, 9.0, 11.0, 14.0, 8.0, 13.0, 10.0);

        WelfordAccumulator single = WelfordAccumulator.empty();
        values.forEach(single::add);

        WelfordAccumulator firstChunk = WelfordAccumulator.empty();
        values.subList(0, 4).forEach(firstChunk::add);
        WelfordAccumulator secondChunk = WelfordAccumulator.empty();
        values.subList(4, 8).forEach(secondChunk::add);
        firstChunk.merge(secondChunk);

        assertEquals(single.mean(), firstChunk.mean(), 1e-9);
        assertEquals(single.stdDev(), firstChunk.stdDev(), 1e-9);
        assertEquals(single.min(), firstChunk.min(), 1e-9);
        assertEquals(single.max(), firstChunk.max(), 1e-9);
    }

    @Test
    void watermarkUsesEarlierSeriesEndDate() {
        RollingReturnRow fundLate = row("January 2, 2024", 12.0);
        RollingReturnRow indexEarly = row("January 1, 2024", 10.0);

        Optional<Instant> watermark = AggregateFolder.computeWatermark(List.of(fundLate), List.of(indexEarly));
        assertEquals(Optional.of(Instant.parse("2024-01-01T00:00:00Z")), watermark);
    }

    @Test
    void unparseableNavDatesDoNotAdvanceTheWatermark() {
        RollingReturnRow good = row("January 2, 2024", 12.0);
        RollingReturnRow broken = row("not a date", 15.0);

        Optional<Instant> watermark =
                AggregateFolder.computeWatermark(List.of(good, broken), List.of(good, broken));
        assertEquals(Optional.of(Instant.parse("2024-01-02T00:00:00Z")), watermark);
    }

    @Test
    void unparseableNavDatesAreNotCountedAsNewRows() {
        Instant watermark = Instant.parse("2024-01-05T00:00:00Z");
        RollingReturnsData data = new RollingReturnsData(
                List.of(row("not a date", 15.0)),
                List.of(row("not a date", 9.0)));

        RollingAggregate folded =
                AggregateFolder.fold("SCHEME", Period.FIVE_YEAR, data, watermark, Instant.parse("2026-01-15T00:00:00Z"));

        assertEquals(0, folded.fundStats().count());
        assertEquals(0, folded.indexStats().count());
    }

    private RollingReturnRow row(String navDate, double rollingReturn) {
        return new RollingReturnRow(
                1,
                "AMC",
                "Category",
                "Fund",
                "5 Year",
                navDate,
                100,
                navDate,
                110,
                rollingReturn);
    }
}
