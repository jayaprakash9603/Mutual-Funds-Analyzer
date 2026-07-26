package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MatrixSnapshotMongoRepository extends MongoRepository<MatrixSnapshotDocument, String> {
    Optional<MatrixSnapshotDocument> findBySchemeAndModeAndStartDate(String scheme, String mode, String startDate);
}
