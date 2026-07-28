package in.goldentriangle.mfa.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "features.sync")
public record SyncProperties(
        boolean enabled,
        String dailyCron,
        int maxAttemptsPerDay,
        String zoneId) {

    public SyncProperties {
        if (zoneId == null || zoneId.isBlank()) {
            zoneId = "Asia/Kolkata";
        }
        if (maxAttemptsPerDay <= 0) {
            maxAttemptsPerDay = 3;
        }
    }
}
