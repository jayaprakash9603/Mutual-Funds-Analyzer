package in.goldentriangle.mfa.adapter.out.persistence;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.port.out.RollingAggregatePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class FailSoftRollingAggregateStore implements RollingAggregatePort {

    private static final Logger log = LoggerFactory.getLogger(FailSoftRollingAggregateStore.class);

    private final RollingAggregatePort delegate;

    public FailSoftRollingAggregateStore(List<RollingAggregatePort> ports) {
        this.delegate = ports.stream()
                .filter(port -> !(port instanceof FailSoftRollingAggregateStore))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No RollingAggregatePort delegate configured"));
    }

    @Override
    public Optional<RollingAggregate> find(String scheme, Period period) {
        try {
            return delegate.find(scheme, period);
        } catch (Exception ex) {
            log.warn("Rolling aggregate lookup failed for {} / {}: {}", scheme, period, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public RollingAggregate save(RollingAggregate aggregate) {
        try {
            return delegate.save(aggregate);
        } catch (Exception ex) {
            log.warn("Rolling aggregate save failed for {} / {}: {}", aggregate.scheme(), aggregate.period(), ex.getMessage());
            return aggregate;
        }
    }
}
