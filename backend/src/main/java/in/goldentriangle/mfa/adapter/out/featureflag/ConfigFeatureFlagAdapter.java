package in.goldentriangle.mfa.adapter.out.featureflag;

import in.goldentriangle.mfa.config.feature.FeatureFlagResolver;
import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.domain.port.out.FeatureFlagPort;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class ConfigFeatureFlagAdapter implements FeatureFlagPort {

    private final FeatureFlags featureFlags;

    public ConfigFeatureFlagAdapter(FeatureFlags featureFlags) {
        this.featureFlags = featureFlags;
    }

    @Override
    public boolean isEnabled(String key) {
        return override(key).orElseGet(() -> FeatureFlagResolver.isEnabled(featureFlags, key));
    }

    @Override
    public Map<String, Boolean> allFlags() {
        return FeatureFlagResolver.allFlags(featureFlags);
    }

    @Override
    public Optional<Boolean> override(String key) {
        return Optional.empty();
    }
}
