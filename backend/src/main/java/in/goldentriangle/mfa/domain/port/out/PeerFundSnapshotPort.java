package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.PeerFundSnapshot;

import java.util.Optional;

public interface PeerFundSnapshotPort {

    Optional<PeerFundSnapshot> find(String scheme, String startDate);

    PeerFundSnapshot save(PeerFundSnapshot snapshot);
}
