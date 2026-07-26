package in.goldentriangle.mfa.adapter.in.web.dto.section;

import java.time.Instant;

public record ReportSectionEnvelopeDto<T>(
        T data,
        String freshness,
        Instant watermarkNavDate,
        Instant computedAt,
        int schemaVersion) {
}
