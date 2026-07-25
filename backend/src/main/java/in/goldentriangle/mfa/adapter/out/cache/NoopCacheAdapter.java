package in.goldentriangle.mfa.adapter.out.cache;

import in.goldentriangle.mfa.domain.port.out.CachePort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.function.Supplier;

/**
 * Mirrors the condition on {@link CaffeineCacheAdapter} rather than using
 * {@code @ConditionalOnMissingBean}, which is only ordered reliably inside auto-configuration.
 */
@Component
@ConditionalOnProperty(prefix = "features.platform.cache", name = "enabled", havingValue = "false")
public class NoopCacheAdapter implements CachePort {

    @Override
    public <T> Optional<T> get(String key, Class<T> type) {
        return Optional.empty();
    }

    @Override
    public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
        return loader.get();
    }

    @Override
    public void evict(String key) {
    }
}
