package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.PeerComparisonSnapshot;

import java.util.Optional;

public interface PeerComparisonSnapshotPort {

    Optional<PeerComparisonSnapshot> find(String scheme, String category, String startDate);

    PeerComparisonSnapshot save(PeerComparisonSnapshot snapshot);
}
