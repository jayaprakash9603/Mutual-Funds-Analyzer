package in.goldentriangle.mfa.adapter.out.persistence.jpa.peer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PeerFundSnapshotJpaRepository extends JpaRepository<PeerFundSnapshotEntity, Long> {

    Optional<PeerFundSnapshotEntity> findBySchemeAndStartDate(String scheme, String startDate);
}
