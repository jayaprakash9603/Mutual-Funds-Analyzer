package in.goldentriangle.mfa.adapter.out.persistence.jpa.rolling;

import in.goldentriangle.mfa.adapter.out.persistence.mapper.RollingAggregateMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.config.concurrency.OptimisticLockRetry;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.port.out.RollingAggregatePort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaRollingAggregateStore implements RollingAggregatePort {

    private final RollingAggregateJpaRepository repository;

    public JpaRollingAggregateStore(RollingAggregateJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<RollingAggregate> find(String scheme, Period period) {
        return repository.findBySchemeAndPeriod(scheme, period.label())
                .map(RollingAggregateMapper::toDomain);
    }

    @Override
    public RollingAggregate save(RollingAggregate aggregate) {
        return OptimisticLockRetry.run(() -> {
            RollingAggregateEntity entity = load(aggregate).orElseGet(RollingAggregateEntity::new);
            RollingAggregateMapper.apply(entity, aggregate);
            return RollingAggregateMapper.toDomain(repository.save(entity));
        });
    }

    private Optional<RollingAggregateEntity> load(RollingAggregate aggregate) {
        return repository.findBySchemeAndPeriod(aggregate.scheme(), aggregate.period().label());
    }
}
