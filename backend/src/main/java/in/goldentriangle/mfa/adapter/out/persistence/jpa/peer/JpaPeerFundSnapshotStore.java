package in.goldentriangle.mfa.adapter.out.persistence.jpa.peer;

import in.goldentriangle.mfa.adapter.out.persistence.mapper.PeerSnapshotMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.config.concurrency.OptimisticLockRetry;
import in.goldentriangle.mfa.domain.model.PeerFundSnapshot;
import in.goldentriangle.mfa.domain.port.out.PeerFundSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaPeerFundSnapshotStore implements PeerFundSnapshotPort {

    private final PeerFundSnapshotJpaRepository repository;

    public JpaPeerFundSnapshotStore(PeerFundSnapshotJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<PeerFundSnapshot> find(String scheme, String startDate) {
        return repository.findBySchemeAndStartDate(scheme, startDate)
                .map(PeerSnapshotMapper::toFundDomain);
    }

    @Override
    public PeerFundSnapshot save(PeerFundSnapshot snapshot) {
        return OptimisticLockRetry.run(() -> {
            PeerFundSnapshotEntity entity = repository
                    .findBySchemeAndStartDate(snapshot.scheme(), snapshot.startDate())
                    .orElseGet(PeerFundSnapshotEntity::new);
            PeerSnapshotMapper.applyFund(entity, snapshot);
            return PeerSnapshotMapper.toFundDomain(repository.save(entity));
        });
    }
}
