package in.goldentriangle.mfa.config.concurrency;

import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.concurrency.KeyedLock;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class MatrixExecutorConfig {

    private static final String COMPUTE_THREAD_PREFIX = "compute-";
    private static final String UPSTREAM_THREAD_PREFIX = "upstream-";

    @Bean(name = "computeExecutor")
    ThreadPoolTaskExecutor computeExecutor(AnalyticsProperties analyticsProperties) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(analyticsProperties.computePoolSize());
        executor.setMaxPoolSize(analyticsProperties.computePoolSize());
        executor.setQueueCapacity(analyticsProperties.computeQueueCapacity());
        executor.setThreadNamePrefix(COMPUTE_THREAD_PREFIX);
        executor.setRejectedExecutionHandler(backpressureHandler());
        executor.initialize();
        return executor;
    }

    @Bean(name = "upstreamExecutor")
    ThreadPoolTaskExecutor upstreamExecutor(AnalyticsProperties analyticsProperties) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(analyticsProperties.upstreamPoolSize());
        executor.setMaxPoolSize(analyticsProperties.upstreamPoolSize());
        executor.setQueueCapacity(analyticsProperties.upstreamQueueCapacity());
        executor.setThreadNamePrefix(UPSTREAM_THREAD_PREFIX);
        executor.setRejectedExecutionHandler(backpressureHandler());
        executor.initialize();
        return executor;
    }

    /**
     * Deprecated alias retained for beans not yet migrated; routes to upstream I/O pool.
     */
    @Bean(name = "matrixExecutor")
    Executor matrixExecutor(ThreadPoolTaskExecutor upstreamExecutor) {
        return upstreamExecutor;
    }

    @Bean
    KeyedLock navRefreshLock() {
        return new KeyedLock();
    }

    @Bean
    SingleFlightCoordinator singleFlightCoordinator() {
        return new SingleFlightCoordinator();
    }

    /** Runs work on the caller when saturated instead of failing the request. */
    private static RejectedExecutionHandler backpressureHandler() {
        return new ThreadPoolExecutor.CallerRunsPolicy();
    }
}
