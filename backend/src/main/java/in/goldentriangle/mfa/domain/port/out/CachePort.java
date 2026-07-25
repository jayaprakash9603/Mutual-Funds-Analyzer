package in.goldentriangle.mfa.domain.port.out;

import java.util.Optional;
import java.util.function.Supplier;

public interface CachePort {
    <T> Optional<T> get(String key, Class<T> type);

    /** Entry lifetime is a property of the cache implementation, not of the individual call. */
    <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader);

    void evict(String key);
}
