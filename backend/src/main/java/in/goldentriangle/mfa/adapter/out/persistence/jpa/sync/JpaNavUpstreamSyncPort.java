package in.goldentriangle.mfa.adapter.out.persistence.jpa.sync;

import in.goldentriangle.mfa.adapter.out.persistence.mapper.NavUpstreamSyncMapper;
import in.goldentriangle.mfa.domain.model.NavUpstreamSyncAttempt;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.model.UpstreamSyncStatus;
import in.goldentriangle.mfa.domain.port.out.NavUpstreamSyncPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

@Repository
@ConditionalOnProperty(prefix = "features.platform.persistence", name = "enabled", havingValue = "true")
public class JpaNavUpstreamSyncPort implements NavUpstreamSyncPort {

    private final NavUpstreamSyncAttemptJpaRepository repository;
    private final Clock clock;

    public JpaNavUpstreamSyncPort(NavUpstreamSyncAttemptJpaRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<NavUpstreamSyncAttempt> find(int schemeCode, UpstreamSyncSource source, LocalDate syncDate) {
        return repository.findBySchemeCodeAndSourceAndSyncDate(schemeCode, source.name(), syncDate)
                .map(NavUpstreamSyncMapper::toDomain);
    }

    @Override
    @Transactional
    public NavUpstreamSyncAttempt beginAttempt(int schemeCode, UpstreamSyncSource source, LocalDate syncDate) {
        NavUpstreamSyncAttemptEntity entity = repository
                .findBySchemeCodeAndSourceAndSyncDate(schemeCode, source.name(), syncDate)
                .orElseGet(NavUpstreamSyncAttemptEntity::new);
        Instant now = Instant.now(clock);
        entity.setSchemeCode(schemeCode);
        entity.setSource(source.name());
        entity.setSyncDate(syncDate);
        entity.setAttemptCount(entity.getAttemptCount() + 1);
        entity.setLastAttemptAt(now);
        if (entity.getStatus() == null || UpstreamSyncStatus.SUCCESS.name().equals(entity.getStatus())) {
            entity.setStatus(UpstreamSyncStatus.PENDING.name());
        }
        entity.setLastError(null);
        return NavUpstreamSyncMapper.toDomain(repository.save(entity));
    }

    @Override
    @Transactional
    public NavUpstreamSyncAttempt markSuccess(int schemeCode, UpstreamSyncSource source, LocalDate syncDate) {
        NavUpstreamSyncAttemptEntity entity = requireEntity(schemeCode, source, syncDate);
        entity.setStatus(UpstreamSyncStatus.SUCCESS.name());
        entity.setLastError(null);
        entity.setLastAttemptAt(Instant.now(clock));
        return NavUpstreamSyncMapper.toDomain(repository.save(entity));
    }

    @Override
    @Transactional
    public NavUpstreamSyncAttempt markFailure(
            int schemeCode,
            UpstreamSyncSource source,
            LocalDate syncDate,
            String errorMessage) {
        NavUpstreamSyncAttemptEntity entity = requireEntity(schemeCode, source, syncDate);
        entity.setStatus(UpstreamSyncStatus.FAILED.name());
        entity.setLastError(truncate(errorMessage));
        entity.setLastAttemptAt(Instant.now(clock));
        return NavUpstreamSyncMapper.toDomain(repository.save(entity));
    }

    private NavUpstreamSyncAttemptEntity requireEntity(
            int schemeCode,
            UpstreamSyncSource source,
            LocalDate syncDate) {
        return repository.findBySchemeCodeAndSourceAndSyncDate(schemeCode, source.name(), syncDate)
                .orElseThrow(() -> new IllegalStateException(
                        "Missing sync attempt row for scheme " + schemeCode + " " + source + " " + syncDate));
    }

    private static String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= 512 ? message : message.substring(0, 512);
    }
}
