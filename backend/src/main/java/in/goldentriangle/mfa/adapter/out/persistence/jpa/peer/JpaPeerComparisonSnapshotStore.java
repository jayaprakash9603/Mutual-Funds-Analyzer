package in.goldentriangle.mfa.adapter.out.persistence.jpa.peer;

import in.goldentriangle.mfa.adapter.out.persistence.mapper.PeerSnapshotMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.config.concurrency.OptimisticLockRetry;
import in.goldentriangle.mfa.domain.model.PeerComparisonSnapshot;
import in.goldentriangle.mfa.domain.port.out.PeerComparisonSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaPeerComparisonSnapshotStore implements PeerComparisonSnapshotPort {

    private final PeerComparisonSnapshotJpaRepository repository;

    public JpaPeerComparisonSnapshotStore(PeerComparisonSnapshotJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<PeerComparisonSnapshot> find(String scheme, String category, String startDate) {
        return repository.findBySchemeAndCategoryAndStartDate(scheme, category, startDate)
                .map(PeerSnapshotMapper::toComparisonDomain);
    }

    @Override
    public PeerComparisonSnapshot save(PeerComparisonSnapshot snapshot) {
        return OptimisticLockRetry.run(() -> {
            PeerComparisonSnapshotEntity entity = repository
                    .findBySchemeAndCategoryAndStartDate(
                            snapshot.scheme(), snapshot.category(), snapshot.startDate())
                    .orElseGet(PeerComparisonSnapshotEntity::new);
            PeerSnapshotMapper.applyComparison(entity, snapshot);
            return PeerSnapshotMapper.toComparisonDomain(repository.save(entity));
        });
    }
}
