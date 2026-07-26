package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopMatrixSnapshotStore implements MatrixSnapshotPort {

    @Override
    public Optional<MatrixSnapshot> find(String scheme, MatrixMode mode, String startDate) {
        return Optional.empty();
    }

    @Override
    public MatrixSnapshot save(MatrixSnapshot snapshot) {
        return snapshot;
    }
}
