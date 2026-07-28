package in.goldentriangle.mfa.adapter.out.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.function.Supplier;

@Component
@ConditionalOnProperty(prefix = "features.platform.cache", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CaffeineCacheAdapter implements CachePort {

    private final Cache<String, Object> cache;
    private final SingleFlightCoordinator singleFlight;

    public CaffeineCacheAdapter(FeatureFlags featureFlags, SingleFlightCoordinator singleFlight) {
        FeatureFlags.CacheFeatures settings = featureFlags.getPlatform().getCache();
        long maxWeightBytes = Math.max(1, settings.getMaxWeightMb()) * 1024L * 1024L;
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(settings.getTtl())
                .maximumWeight(maxWeightBytes)
                .weigher((String key, Object value) -> estimateWeight(value))
                .recordStats()
                .build();
        this.singleFlight = singleFlight;
    }

    private static int estimateWeight(Object value) {
        if (value == null) {
            return 1;
        }
        if (value instanceof String stringValue) {
            return Math.max(64, stringValue.length() * 2);
        }
        return Math.max(512, value.toString().length() * 2);
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

        T loaded = singleFlight.run(key, () -> {
            Object existing = cache.getIfPresent(key);
            if (existing != null) {
                return type.cast(existing);
            }
            T value = loader.get();
            cache.put(key, value);
            return value;
        });
        return loaded;
    }

    @Override
    public void evict(String key) {
        cache.invalidate(key);
    }
}
