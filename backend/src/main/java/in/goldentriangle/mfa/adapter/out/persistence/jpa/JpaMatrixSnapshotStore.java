package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.MatrixSnapshotMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.OptimisticLockingFailureException;
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
        MatrixSnapshotEntity entity = load(snapshot).orElseGet(MatrixSnapshotEntity::new);
        apply(entity, snapshot);
        try {
            return MatrixSnapshotMapper.toDomain(repository.save(entity), objectMapper);
        } catch (OptimisticLockingFailureException ex) {
            MatrixSnapshotEntity latest = load(snapshot).orElseThrow(() -> ex);
            apply(latest, snapshot);
            return MatrixSnapshotMapper.toDomain(repository.save(latest), objectMapper);
        }
    }

    private Optional<MatrixSnapshotEntity> load(MatrixSnapshot snapshot) {
        return repository.findBySchemeAndModeAndStartDate(
                snapshot.scheme(), snapshot.mode().name(), snapshot.startDate());
    }

    private void apply(MatrixSnapshotEntity entity, MatrixSnapshot snapshot) {
        MatrixSnapshotMapper.apply(entity, snapshot, objectMapper);
        if (entity.getId() != null) {
            entity.setVersion(snapshot.version());
        }
    }
}
