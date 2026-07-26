package in.goldentriangle.mfa.adapter.out.persistence;

import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class FailSoftMatrixSnapshotStore implements MatrixSnapshotPort {

    private static final Logger log = LoggerFactory.getLogger(FailSoftMatrixSnapshotStore.class);

    private final MatrixSnapshotPort delegate;

    public FailSoftMatrixSnapshotStore(List<MatrixSnapshotPort> ports) {
        this.delegate = ports.stream()
                .filter(port -> !(port instanceof FailSoftMatrixSnapshotStore))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No MatrixSnapshotPort delegate configured"));
    }

    @Override
    public Optional<MatrixSnapshot> find(String scheme, MatrixMode mode, String startDate) {
        try {
            return delegate.find(scheme, mode, startDate);
        } catch (Exception ex) {
            log.warn("Matrix snapshot lookup failed for {} / {} / {}: {}", scheme, mode, startDate, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public MatrixSnapshot save(MatrixSnapshot snapshot) {
        try {
            return delegate.save(snapshot);
        } catch (Exception ex) {
            log.warn(
                    "Matrix snapshot save failed for {} / {} / {}: {}",
                    snapshot.scheme(),
                    snapshot.mode(),
                    snapshot.startDate(),
                    ex.getMessage());
            return snapshot;
        }
    }
}
