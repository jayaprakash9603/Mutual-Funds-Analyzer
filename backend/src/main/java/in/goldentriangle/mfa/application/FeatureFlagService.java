package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.domain.port.in.GetFeatureFlagsUseCase;
import in.goldentriangle.mfa.domain.port.out.FeatureFlagPort;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class FeatureFlagService implements GetFeatureFlagsUseCase {

    private final FeatureFlagPort featureFlagPort;

    public FeatureFlagService(FeatureFlagPort featureFlagPort) {
        this.featureFlagPort = featureFlagPort;
    }

    @Override
    public Map<String, Boolean> getFlags() {
        return featureFlagPort.allFlags();
    }
}
