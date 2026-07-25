package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.HealthResponseDto;
import in.goldentriangle.mfa.domain.port.out.FeatureFlagPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final FeatureFlagPort featureFlagPort;

    @Value("${spring.application.version:0.0.1-SNAPSHOT}")
    private String version;

    public HealthController(FeatureFlagPort featureFlagPort) {
        this.featureFlagPort = featureFlagPort;
    }

    @GetMapping("/health")
    HealthResponseDto health() {
        String hash = Integer.toHexString(featureFlagPort.allFlags().hashCode());
        return new HealthResponseDto(true, version, hash);
    }
}
