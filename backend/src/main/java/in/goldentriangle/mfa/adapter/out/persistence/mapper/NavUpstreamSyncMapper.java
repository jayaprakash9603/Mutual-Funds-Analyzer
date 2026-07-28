package in.goldentriangle.mfa.adapter.out.persistence.mapper;

import in.goldentriangle.mfa.adapter.out.persistence.jpa.sync.NavUpstreamSyncAttemptEntity;
import in.goldentriangle.mfa.domain.model.NavUpstreamSyncAttempt;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.model.UpstreamSyncStatus;

public final class NavUpstreamSyncMapper {

    private NavUpstreamSyncMapper() {
    }

    public static NavUpstreamSyncAttempt toDomain(NavUpstreamSyncAttemptEntity entity) {
        return new NavUpstreamSyncAttempt(
                entity.getSchemeCode(),
                UpstreamSyncSource.valueOf(entity.getSource()),
                entity.getSyncDate(),
                entity.getAttemptCount(),
                entity.getLastAttemptAt(),
                UpstreamSyncStatus.valueOf(entity.getStatus()),
                entity.getLastError());
    }

    public static void apply(
            NavUpstreamSyncAttemptEntity entity,
            NavUpstreamSyncAttempt attempt) {
        entity.setSchemeCode(attempt.schemeCode());
        entity.setSource(attempt.source().name());
        entity.setSyncDate(attempt.syncDate());
        entity.setAttemptCount(attempt.attemptCount());
        entity.setLastAttemptAt(attempt.lastAttemptAt());
        entity.setStatus(attempt.status().name());
        entity.setLastError(attempt.lastError());
    }
}
