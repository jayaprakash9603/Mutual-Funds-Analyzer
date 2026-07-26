package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;

import java.util.Optional;

public interface MatrixSnapshotPort {
    Optional<MatrixSnapshot> find(String scheme, MatrixMode mode, String startDate);

    MatrixSnapshot save(MatrixSnapshot snapshot);
}
