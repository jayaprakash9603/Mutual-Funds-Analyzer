package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import in.goldentriangle.mfa.adapter.out.persistence.RollingAggregateMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.port.out.RollingAggregatePort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.MONGO)
public class MongoRollingAggregateStore implements RollingAggregatePort {

    private final RollingAggregateMongoRepository repository;

    public MongoRollingAggregateStore(RollingAggregateMongoRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<RollingAggregate> find(String scheme, Period period) {
        return repository.findBySchemeAndPeriod(scheme, period.label())
                .map(RollingAggregateMapper::toDomain);
    }

    @Override
    public RollingAggregate save(RollingAggregate aggregate) {
        RollingAggregateDocument document = repository
                .findBySchemeAndPeriod(aggregate.scheme(), aggregate.period().label())
                .orElseGet(RollingAggregateDocument::new);
        RollingAggregateMapper.apply(document, aggregate);
        document.setVersion(aggregate.version());
        return RollingAggregateMapper.toDomain(repository.save(document));
    }
}
