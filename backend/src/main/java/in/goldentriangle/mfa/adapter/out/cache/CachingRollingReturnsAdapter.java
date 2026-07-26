package in.goldentriangle.mfa.adapter.out.cache;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@ConditionalOnProperty(prefix = "features.platform.cache", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CachingRollingReturnsAdapter implements RollingReturnsPort {

    private static final String KEY_PREFIX = "rolling-returns:";

    private final RollingReturnsPort delegate;
    private final CachePort cachePort;

    public CachingRollingReturnsAdapter(
            @Qualifier("upstreamRollingReturnsPort") RollingReturnsPort delegate,
            CachePort cachePort) {
        this.delegate = delegate;
        this.cachePort = cachePort;
    }

    @Override
    public RollingReturnsData fetch(AnalysisQuery query) {
        String key = KEY_PREFIX + query.scheme() + ":" + query.period().label() + ":" + query.startDate();
        return cachePort.getOrLoad(key, RollingReturnsData.class, () -> delegate.fetch(query));
    }
}
