package in.goldentriangle.mfa.domain.model;

import java.time.Instant;

/** Assembled peer comparison for a fund within a category. */
public record PeerComparisonSnapshot(
        String scheme,
        String category,
        String startDate,
        String peerSchemesJson,
        String payloadJson,
        Instant watermarkNavDate,
        Instant computedAt,
        int schemaVersion,
        long version) {
}
