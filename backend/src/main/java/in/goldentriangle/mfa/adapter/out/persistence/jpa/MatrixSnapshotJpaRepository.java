package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MatrixSnapshotJpaRepository extends JpaRepository<MatrixSnapshotEntity, Long> {
    Optional<MatrixSnapshotEntity> findBySchemeAndModeAndStartDate(String scheme, String mode, String startDate);
}
