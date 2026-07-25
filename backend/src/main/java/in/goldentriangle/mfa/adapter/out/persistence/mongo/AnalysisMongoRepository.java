package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AnalysisMongoRepository extends MongoRepository<AnalysisDocument, String> {
    Optional<AnalysisDocument> findFirstBySchemeAndPeriodOrderByAnalysedAtDesc(String scheme, String period);
}
