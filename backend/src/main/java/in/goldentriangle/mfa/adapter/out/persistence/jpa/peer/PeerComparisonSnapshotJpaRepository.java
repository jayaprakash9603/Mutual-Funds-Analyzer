package in.goldentriangle.mfa.adapter.out.persistence.jpa.peer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PeerComparisonSnapshotJpaRepository extends JpaRepository<PeerComparisonSnapshotEntity, Long> {

    Optional<PeerComparisonSnapshotEntity> findBySchemeAndCategoryAndStartDate(
            String scheme, String category, String startDate);
}
