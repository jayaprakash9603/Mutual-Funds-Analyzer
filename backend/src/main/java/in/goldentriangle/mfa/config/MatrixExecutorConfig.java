package in.goldentriangle.mfa.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class MatrixExecutorConfig {

    private static final String THREAD_NAME_PREFIX = "matrix-";

    @Bean(name = "matrixExecutor")
    Executor matrixExecutor(AnalyticsProperties analyticsProperties) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(analyticsProperties.matrixPoolSize());
        executor.setMaxPoolSize(analyticsProperties.matrixPoolSize());
        executor.setQueueCapacity(analyticsProperties.matrixQueueCapacity());
        executor.setThreadNamePrefix(THREAD_NAME_PREFIX);
        executor.initialize();
        return executor;
    }
}
