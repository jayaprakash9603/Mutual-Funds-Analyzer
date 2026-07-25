package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnalysisJpaRepository extends JpaRepository<AnalysisEntity, Long> {

    Optional<AnalysisEntity> findFirstBySchemeAndPeriodOrderByAnalysedAtDesc(String scheme, String period);

    List<AnalysisEntity> findAllByOrderByAnalysedAtDesc(Pageable pageable);
}
