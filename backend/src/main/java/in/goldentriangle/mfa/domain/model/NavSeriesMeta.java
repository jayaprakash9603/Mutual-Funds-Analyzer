package in.goldentriangle.mfa.domain.model;

import java.time.Instant;

public record NavSeriesMeta(
        int schemeCode,
        String scheme,
        String fundName,
        String benchmarkName,
        String category,
        String amc,
        Instant firstNavDate,
        Instant watermarkNavDate,
        Instant benchmarkWatermarkNavDate,
        Instant refreshedAt,
        long version) {
}
