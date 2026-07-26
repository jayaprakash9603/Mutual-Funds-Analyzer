package in.goldentriangle.mfa.config.concurrency;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;

import java.util.function.Supplier;

public final class OptimisticLockRetry {

    private static final int MAX_ATTEMPTS = 3;

    private OptimisticLockRetry() {
    }

    public static <T> T run(Supplier<T> attempt) {
        RuntimeException last = null;
        for (int attemptIndex = 0; attemptIndex < MAX_ATTEMPTS; attemptIndex++) {
            try {
                return attempt.get();
            } catch (OptimisticLockingFailureException | DataIntegrityViolationException ex) {
                last = ex;
            }
        }
        throw last;
    }
}
