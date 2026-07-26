package in.goldentriangle.mfa.config.concurrency;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Coordinates in-flight work by key so concurrent callers share one result.
 * Nested loads on the same thread run inline to avoid self-deadlock.
 */
public final class SingleFlightCoordinator {

    private final ConcurrentHashMap<String, CompletableFuture<Object>> inFlight = new ConcurrentHashMap<>();
    private final ThreadLocal<Set<String>> activeKeys = ThreadLocal.withInitial(HashSet::new);

    @SuppressWarnings("unchecked")
    public <T> T run(String key, Supplier<T> supplier) {
        Set<String> active = activeKeys.get();
        if (active.contains(key)) {
            return supplier.get();
        }

        CompletableFuture<Object> created = new CompletableFuture<>();
        CompletableFuture<Object> existing = inFlight.putIfAbsent(key, created);
        if (existing != null) {
            return (T) await(existing);
        }

        active.add(key);
        try {
            T value = supplier.get();
            created.complete(value);
            return value;
        } catch (Throwable ex) {
            created.completeExceptionally(ex);
            throw ex;
        } finally {
            active.remove(key);
            inFlight.remove(key, created);
        }
    }

    private static Object await(CompletableFuture<Object> future) {
        return future.join();
    }
}
