package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RollingAggregateMongoRepository extends MongoRepository<RollingAggregateDocument, String> {
    Optional<RollingAggregateDocument> findBySchemeAndPeriod(String scheme, String period);
}
