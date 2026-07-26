package in.goldentriangle.mfa.adapter.out.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import in.goldentriangle.mfa.config.FeatureFlags;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.function.Supplier;

@Component
@ConditionalOnProperty(prefix = "features.platform.cache", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CaffeineCacheAdapter implements CachePort {

    private final Cache<String, Object> cache;

    public CaffeineCacheAdapter(FeatureFlags featureFlags) {
        FeatureFlags.CacheFeatures settings = featureFlags.getPlatform().getCache();
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(settings.getTtl())
                .maximumSize(settings.getMaxSize())
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> Optional<T> get(String key, Class<T> type) {
        Object value = cache.getIfPresent(key);
        if (value == null) {
            return Optional.empty();
        }
        return Optional.of((T) value);
    }

    @Override
    public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
        Object cached = cache.getIfPresent(key);
        if (cached != null) {
            return type.cast(cached);
        }
        // Load outside Caffeine's atomic loader to avoid IllegalStateException when a loader
        // calls getOrLoad again on the same cache (e.g. fund-report -> navHistory -> mfapi-nav).
        T loaded = loader.get();
        cache.put(key, loaded);
        return loaded;
    }

    @Override
    public void evict(String key) {
        cache.invalidate(key);
    }
}
