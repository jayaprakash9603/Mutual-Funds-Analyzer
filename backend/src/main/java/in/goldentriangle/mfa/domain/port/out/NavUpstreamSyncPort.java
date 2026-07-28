package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.NavUpstreamSyncAttempt;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.model.UpstreamSyncStatus;

import java.time.LocalDate;
import java.util.Optional;

public interface NavUpstreamSyncPort {

    Optional<NavUpstreamSyncAttempt> find(int schemeCode, UpstreamSyncSource source, LocalDate syncDate);

    NavUpstreamSyncAttempt beginAttempt(int schemeCode, UpstreamSyncSource source, LocalDate syncDate);

    NavUpstreamSyncAttempt markSuccess(int schemeCode, UpstreamSyncSource source, LocalDate syncDate);

    NavUpstreamSyncAttempt markFailure(
            int schemeCode,
            UpstreamSyncSource source,
            LocalDate syncDate,
            String errorMessage);

    default boolean isSuccessfulToday(int schemeCode, UpstreamSyncSource source, LocalDate syncDate) {
        return find(schemeCode, source, syncDate)
                .map(attempt -> attempt.status() == UpstreamSyncStatus.SUCCESS)
                .orElse(false);
    }

    default boolean hasExhaustedAttempts(
            int schemeCode,
            UpstreamSyncSource source,
            LocalDate syncDate,
            int maxAttemptsPerDay) {
        return find(schemeCode, source, syncDate)
                .map(attempt -> attempt.status() != UpstreamSyncStatus.SUCCESS
                        && attempt.attemptCount() >= maxAttemptsPerDay)
                .orElse(false);
    }
}
