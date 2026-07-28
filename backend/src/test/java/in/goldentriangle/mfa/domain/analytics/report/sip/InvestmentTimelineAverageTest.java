package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.model.report.investment.SipTimelinePoint;
import in.goldentriangle.mfa.domain.model.report.investment.SwpTimelinePoint;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InvestmentTimelineAverageTest {

    @Test
    void sipAverageUsesMonthToDateCorpusForDaysOneThroughThirty() {
        List<SipTimelinePoint> timeline = List.of(
                new SipTimelinePoint("2024-01-01", 10_000, 100, 10, 100),
                new SipTimelinePoint("2024-01-15", 10_000, 130, 13, 130),
                new SipTimelinePoint("2024-01-30", 10_000, 160, 16, 160),
                new SipTimelinePoint("2024-01-31", 10_000, 170, 17, 170));

        List<SipTimelinePoint> enriched = InvestmentTimelineAverage.enrichSip(timeline);

        assertEquals(100, enriched.get(0).averageCorpus(), 0.01);
        assertEquals(115, enriched.get(1).averageCorpus(), 0.01);
        assertEquals(130, enriched.get(2).averageCorpus(), 0.01);
        assertEquals(130, enriched.get(3).averageCorpus(), 0.01);
    }

    @Test
    void swpAverageResetsEachMonth() {
        List<SwpTimelinePoint> timeline = List.of(
                new SwpTimelinePoint("2024-01-10", 1_000_000, 0, 100, 1_000_000),
                new SwpTimelinePoint("2024-01-20", 1_100_000, 10_000, 110, 1_100_000),
                new SwpTimelinePoint("2024-02-05", 1_050_000, 20_000, 105, 1_050_000));

        List<SwpTimelinePoint> enriched = InvestmentTimelineAverage.enrichSwp(timeline);

        assertEquals(1_000_000, enriched.get(0).averageCorpus(), 0.01);
        assertEquals(1_050_000, enriched.get(1).averageCorpus(), 0.01);
        assertEquals(1_050_000, enriched.get(2).averageCorpus(), 0.01);
    }
}
