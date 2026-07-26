package in.goldentriangle.mfa.application.platform;

import in.goldentriangle.mfa.domain.exception.FeatureDisabledException;
import in.goldentriangle.mfa.domain.port.out.FeatureFlagPort;
import org.springframework.stereotype.Component;

@Component
public class FeatureGuard {

    private final FeatureFlagPort featureFlagPort;

    public FeatureGuard(FeatureFlagPort featureFlagPort) {
        this.featureFlagPort = featureFlagPort;
    }

    public void require(String featureKey) {
        if (!featureFlagPort.isEnabled(featureKey)) {
            throw new FeatureDisabledException(featureKey);
        }
    }
}
