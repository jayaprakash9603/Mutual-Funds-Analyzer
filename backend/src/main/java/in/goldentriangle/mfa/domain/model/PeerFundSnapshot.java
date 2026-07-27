package in.goldentriangle.mfa.domain.model;

import java.time.Instant;

/** Per-fund peer metrics reused across category comparisons. */
public record PeerFundSnapshot(
        String scheme,
        String startDate,
        String payloadJson,
        Instant watermarkNavDate,
        Instant computedAt,
        int schemaVersion,
        long version) {
}
