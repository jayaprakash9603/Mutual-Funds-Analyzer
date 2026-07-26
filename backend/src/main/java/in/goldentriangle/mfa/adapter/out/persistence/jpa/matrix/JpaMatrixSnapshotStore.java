package in.goldentriangle.mfa.adapter.out.persistence.jpa.matrix;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.MatrixSnapshotMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.config.concurrency.OptimisticLockRetry;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaMatrixSnapshotStore implements MatrixSnapshotPort {

    private final MatrixSnapshotJpaRepository repository;
    private final ObjectMapper objectMapper;

    public JpaMatrixSnapshotStore(MatrixSnapshotJpaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<MatrixSnapshot> find(String scheme, MatrixMode mode, String startDate) {
        return repository.findBySchemeAndModeAndStartDate(scheme, mode.name(), startDate)
                .map(entity -> MatrixSnapshotMapper.toDomain(entity, objectMapper));
    }

    @Override
    public MatrixSnapshot save(MatrixSnapshot snapshot) {
        return OptimisticLockRetry.run(() -> {
            MatrixSnapshotEntity entity = load(snapshot).orElseGet(MatrixSnapshotEntity::new);
            MatrixSnapshotMapper.apply(entity, snapshot, objectMapper);
            return MatrixSnapshotMapper.toDomain(repository.save(entity), objectMapper);
        });
    }

    private Optional<MatrixSnapshotEntity> load(MatrixSnapshot snapshot) {
        return repository.findBySchemeAndModeAndStartDate(
                snapshot.scheme(), snapshot.mode().name(), snapshot.startDate());
    }
}
