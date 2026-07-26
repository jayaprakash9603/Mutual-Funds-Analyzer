package in.goldentriangle.mfa.domain.model;

import java.time.Instant;

public record ReportSectionEnvelope<T>(
        T data,
        ReportFreshness freshness,
        Instant watermarkNavDate,
        Instant computedAt,
        int schemaVersion) {
}
