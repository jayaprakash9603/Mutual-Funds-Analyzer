package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RollingAggregateJpaRepository extends JpaRepository<RollingAggregateEntity, Long> {
    Optional<RollingAggregateEntity> findBySchemeAndPeriod(String scheme, String period);
}
