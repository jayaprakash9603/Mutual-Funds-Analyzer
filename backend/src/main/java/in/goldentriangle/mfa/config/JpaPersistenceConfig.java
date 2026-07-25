package in.goldentriangle.mfa.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Scopes JPA repository scanning to the JPA adapter package. Without this, both Spring Data JPA and
 * Spring Data Mongo scan the whole application package and log strict-mode warnings about
 * repositories they cannot assign to a store.
 */
@Configuration
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
@EnableJpaRepositories(basePackages = "in.goldentriangle.mfa.adapter.out.persistence.jpa")
public class JpaPersistenceConfig {
}
