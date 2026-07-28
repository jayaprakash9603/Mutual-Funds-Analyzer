package in.goldentriangle.mfa.domain.model;

import java.time.Instant;
import java.time.LocalDate;

public record NavUpstreamSyncAttempt(
        int schemeCode,
        UpstreamSyncSource source,
        LocalDate syncDate,
        int attemptCount,
        Instant lastAttemptAt,
        UpstreamSyncStatus status,
        String lastError) {
}
