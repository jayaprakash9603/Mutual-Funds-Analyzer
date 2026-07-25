package in.goldentriangle.mfa.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/** Mongo counterpart of {@link JpaPersistenceConfig}. */
@Configuration
@Profile(Profiles.MONGO)
@EnableMongoRepositories(basePackages = "in.goldentriangle.mfa.adapter.out.persistence.mongo")
public class MongoPersistenceConfig {
}
