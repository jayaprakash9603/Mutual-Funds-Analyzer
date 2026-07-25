package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;

import java.util.Optional;

public interface RollingAggregatePort {
    Optional<RollingAggregate> find(String scheme, Period period);

    RollingAggregate save(RollingAggregate aggregate);
}
