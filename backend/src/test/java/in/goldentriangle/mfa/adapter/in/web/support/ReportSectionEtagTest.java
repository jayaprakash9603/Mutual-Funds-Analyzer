package in.goldentriangle.mfa.adapter.in.web.support;

import in.goldentriangle.mfa.adapter.in.web.dto.section.ReportSectionEnvelopeDto;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReportSectionEtagTest {

    @Test
    void etagChangesWhenFreshnessChanges() {
        Instant watermark = Instant.parse("2026-01-01T00:00:00Z");
        Instant computed = Instant.parse("2026-01-02T00:00:00Z");
        ReportSectionEnvelopeDto<String> fresh = new ReportSectionEnvelopeDto<>("x", "FRESH", watermark, computed, 3);
        ReportSectionEnvelopeDto<String> stale = new ReportSectionEnvelopeDto<>("x", "STALE", watermark, computed, 3);
        assertNotEquals(ReportSectionEtag.compute(fresh), ReportSectionEtag.compute(stale));
        assertTrue(ReportSectionEtag.compute(fresh).startsWith("\""));
    }
}
