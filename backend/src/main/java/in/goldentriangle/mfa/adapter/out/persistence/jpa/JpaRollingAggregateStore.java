package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import in.goldentriangle.mfa.adapter.out.persistence.RollingAggregateMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.port.out.RollingAggregatePort;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.OptimisticLockingFailureException;
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
        RollingAggregateEntity entity = load(aggregate).orElseGet(RollingAggregateEntity::new);
        apply(entity, aggregate);
        try {
            return RollingAggregateMapper.toDomain(repository.save(entity));
        } catch (OptimisticLockingFailureException ex) {
            RollingAggregateEntity latest = load(aggregate).orElseThrow(() -> ex);
            apply(latest, aggregate);
            return RollingAggregateMapper.toDomain(repository.save(latest));
        }
    }

    private Optional<RollingAggregateEntity> load(RollingAggregate aggregate) {
        return repository.findBySchemeAndPeriod(aggregate.scheme(), aggregate.period().label());
    }

    private void apply(RollingAggregateEntity entity, RollingAggregate aggregate) {
        RollingAggregateMapper.apply(entity, aggregate);
        if (entity.getId() != null) {
            entity.setVersion(aggregate.version());
        }
    }
}
