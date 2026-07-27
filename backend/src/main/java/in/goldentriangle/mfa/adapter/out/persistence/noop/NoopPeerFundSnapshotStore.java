package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.PeerFundSnapshot;
import in.goldentriangle.mfa.domain.port.out.PeerFundSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopPeerFundSnapshotStore implements PeerFundSnapshotPort {

    @Override
    public Optional<PeerFundSnapshot> find(String scheme, String startDate) {
        return Optional.empty();
    }

    @Override
    public PeerFundSnapshot save(PeerFundSnapshot snapshot) {
        return snapshot;
    }
}
