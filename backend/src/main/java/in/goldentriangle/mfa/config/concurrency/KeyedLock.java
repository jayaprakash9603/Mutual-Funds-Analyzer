package in.goldentriangle.mfa.config.concurrency;

import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Per-key mutex with reference counting so unused locks can be reclaimed.
 */
public final class KeyedLock {

    private final ConcurrentHashMap<String, LockRef> locks = new ConcurrentHashMap<>();

    public <T> T call(String key, Supplier<T> supplier) {
        LockRef ref = acquire(key);
        try {
            synchronized (ref.lock) {
                return supplier.get();
            }
        } finally {
            release(key, ref);
        }
    }

    public void run(String key, Runnable action) {
        call(key, () -> {
            action.run();
            return null;
        });
    }

    private LockRef acquire(String key) {
        while (true) {
            LockRef created = new LockRef();
            LockRef existing = locks.putIfAbsent(key, created);
            if (existing == null) {
                created.holders.increment();
                return created;
            }
            synchronized (existing.lock) {
                if (locks.get(key) == existing) {
                    existing.holders.increment();
                    return existing;
                }
            }
        }
    }

    private void release(String key, LockRef ref) {
        synchronized (ref.lock) {
            if (ref.holders.decrement() == 0) {
                locks.remove(key, ref);
            }
        }
    }

    private static final class LockRef {
        private final Object lock = new Object();
        private final HolderCount holders = new HolderCount();
    }

    private static final class HolderCount {
        private int value;

        int increment() {
            return ++value;
        }

        int decrement() {
            return --value;
        }
    }
}
