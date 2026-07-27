package in.goldentriangle.mfa.adapter.out.persistence.failsoft;

import in.goldentriangle.mfa.domain.model.PeerComparisonSnapshot;
import in.goldentriangle.mfa.domain.port.out.PeerComparisonSnapshotPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class FailSoftPeerComparisonSnapshotStore implements PeerComparisonSnapshotPort {

    private static final Logger log = LoggerFactory.getLogger(FailSoftPeerComparisonSnapshotStore.class);

    private final PeerComparisonSnapshotPort delegate;

    public FailSoftPeerComparisonSnapshotStore(List<PeerComparisonSnapshotPort> ports) {
        this.delegate = ports.stream()
                .filter(port -> !(port instanceof FailSoftPeerComparisonSnapshotStore))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No PeerComparisonSnapshotPort delegate configured"));
    }

    @Override
    public Optional<PeerComparisonSnapshot> find(String scheme, String category, String startDate) {
        try {
            return delegate.find(scheme, category, startDate);
        } catch (Exception ex) {
            log.warn("Peer comparison snapshot lookup failed for {} / {} / {}: {}",
                    scheme, category, startDate, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public PeerComparisonSnapshot save(PeerComparisonSnapshot snapshot) {
        try {
            return delegate.save(snapshot);
        } catch (Exception ex) {
            log.warn("Peer comparison snapshot save failed for {} / {} / {}: {}",
                    snapshot.scheme(), snapshot.category(), snapshot.startDate(), ex.getMessage());
            return snapshot;
        }
    }
}
