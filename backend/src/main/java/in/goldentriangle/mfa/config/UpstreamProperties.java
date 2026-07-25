package in.goldentriangle.mfa.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "features.upstream")
public record UpstreamProperties(
        String host,
        String basePath,
        Duration timeout,
        String defaultStartDate
) {
}
