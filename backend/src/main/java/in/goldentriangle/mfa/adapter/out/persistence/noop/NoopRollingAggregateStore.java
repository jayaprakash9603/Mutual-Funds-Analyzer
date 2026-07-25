package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.port.out.RollingAggregatePort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopRollingAggregateStore implements RollingAggregatePort {

    @Override
    public Optional<RollingAggregate> find(String scheme, Period period) {
        return Optional.empty();
    }

    @Override
    public RollingAggregate save(RollingAggregate aggregate) {
        return aggregate;
    }
}
