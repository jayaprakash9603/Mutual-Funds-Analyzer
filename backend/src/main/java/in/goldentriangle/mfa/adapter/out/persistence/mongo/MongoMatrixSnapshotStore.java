package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.MatrixSnapshotMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.port.out.MatrixSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.MONGO)
public class MongoMatrixSnapshotStore implements MatrixSnapshotPort {

    private final MatrixSnapshotMongoRepository repository;
    private final ObjectMapper objectMapper;

    public MongoMatrixSnapshotStore(MatrixSnapshotMongoRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<MatrixSnapshot> find(String scheme, MatrixMode mode, String startDate) {
        return repository.findBySchemeAndModeAndStartDate(scheme, mode.name(), startDate)
                .map(document -> MatrixSnapshotMapper.toDomain(document, objectMapper));
    }

    @Override
    public MatrixSnapshot save(MatrixSnapshot snapshot) {
        MatrixSnapshotDocument document = repository
                .findBySchemeAndModeAndStartDate(snapshot.scheme(), snapshot.mode().name(), snapshot.startDate())
                .orElseGet(MatrixSnapshotDocument::new);
        MatrixSnapshotMapper.apply(document, snapshot, objectMapper);
        document.setVersion(snapshot.version());
        return MatrixSnapshotMapper.toDomain(repository.save(document), objectMapper);
    }
}
