package in.goldentriangle.mfa.config;

import in.goldentriangle.mfa.config.properties.SyncProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(SyncProperties.class)
public class SyncConfig {
}
