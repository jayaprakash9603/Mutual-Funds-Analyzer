package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.PeerComparisonSnapshot;
import in.goldentriangle.mfa.domain.port.out.PeerComparisonSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopPeerComparisonSnapshotStore implements PeerComparisonSnapshotPort {

    @Override
    public Optional<PeerComparisonSnapshot> find(String scheme, String category, String startDate) {
        return Optional.empty();
    }

    @Override
    public PeerComparisonSnapshot save(PeerComparisonSnapshot snapshot) {
        return snapshot;
    }
}
