package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.domain.model.NavUpstreamSyncAttempt;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.model.UpstreamSyncStatus;
import in.goldentriangle.mfa.domain.port.out.NavUpstreamSyncPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

@Repository
@ConditionalOnMissingBean(NavUpstreamSyncPort.class)
public class NoopNavUpstreamSyncPort implements NavUpstreamSyncPort {

    @Override
    public Optional<NavUpstreamSyncAttempt> find(int schemeCode, UpstreamSyncSource source, LocalDate syncDate) {
        return Optional.empty();
    }

    @Override
    public NavUpstreamSyncAttempt beginAttempt(int schemeCode, UpstreamSyncSource source, LocalDate syncDate) {
        return placeholder(schemeCode, source, syncDate, 1);
    }

    @Override
    public NavUpstreamSyncAttempt markSuccess(int schemeCode, UpstreamSyncSource source, LocalDate syncDate) {
        return placeholder(schemeCode, source, syncDate, 1);
    }

    @Override
    public NavUpstreamSyncAttempt markFailure(
            int schemeCode,
            UpstreamSyncSource source,
            LocalDate syncDate,
            String errorMessage) {
        return placeholder(schemeCode, source, syncDate, 1);
    }

    private static NavUpstreamSyncAttempt placeholder(
            int schemeCode,
            UpstreamSyncSource source,
            LocalDate syncDate,
            int attempts) {
        return new NavUpstreamSyncAttempt(
                schemeCode,
                source,
                syncDate,
                attempts,
                Instant.EPOCH,
                UpstreamSyncStatus.PENDING,
                null);
    }
}
