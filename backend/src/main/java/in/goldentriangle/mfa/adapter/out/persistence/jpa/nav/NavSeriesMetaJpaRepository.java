package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NavSeriesMetaJpaRepository extends JpaRepository<NavSeriesMetaEntity, Long> {
    Optional<NavSeriesMetaEntity> findBySchemeCode(int schemeCode);
}
