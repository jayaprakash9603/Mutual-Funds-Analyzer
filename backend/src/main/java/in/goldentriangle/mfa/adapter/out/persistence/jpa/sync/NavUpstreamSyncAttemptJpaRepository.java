package in.goldentriangle.mfa.adapter.out.persistence.jpa.sync;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface NavUpstreamSyncAttemptJpaRepository extends JpaRepository<NavUpstreamSyncAttemptEntity, Long> {
    Optional<NavUpstreamSyncAttemptEntity> findBySchemeCodeAndSourceAndSyncDate(
            int schemeCode,
            String source,
            LocalDate syncDate);
}
