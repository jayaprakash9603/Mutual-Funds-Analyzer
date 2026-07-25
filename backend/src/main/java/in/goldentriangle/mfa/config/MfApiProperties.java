package in.goldentriangle.mfa.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "features.mfapi")
public record MfApiProperties(
        String host,
        Duration timeout,
        Duration navTtl
) {
    public String baseUrl() {
        return "https://" + host;
    }
}
