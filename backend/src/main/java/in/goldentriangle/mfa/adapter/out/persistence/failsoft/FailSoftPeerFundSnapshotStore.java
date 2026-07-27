package in.goldentriangle.mfa.adapter.out.persistence.failsoft;

import in.goldentriangle.mfa.domain.model.PeerFundSnapshot;
import in.goldentriangle.mfa.domain.port.out.PeerFundSnapshotPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class FailSoftPeerFundSnapshotStore implements PeerFundSnapshotPort {

    private static final Logger log = LoggerFactory.getLogger(FailSoftPeerFundSnapshotStore.class);

    private final PeerFundSnapshotPort delegate;

    public FailSoftPeerFundSnapshotStore(List<PeerFundSnapshotPort> ports) {
        this.delegate = ports.stream()
                .filter(port -> !(port instanceof FailSoftPeerFundSnapshotStore))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No PeerFundSnapshotPort delegate configured"));
    }

    @Override
    public Optional<PeerFundSnapshot> find(String scheme, String startDate) {
        try {
            return delegate.find(scheme, startDate);
        } catch (Exception ex) {
            log.warn("Peer fund snapshot lookup failed for {} / {}: {}", scheme, startDate, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public PeerFundSnapshot save(PeerFundSnapshot snapshot) {
        try {
            return delegate.save(snapshot);
        } catch (Exception ex) {
            log.warn("Peer fund snapshot save failed for {} / {}: {}",
                    snapshot.scheme(), snapshot.startDate(), ex.getMessage());
            return snapshot;
        }
    }
}
