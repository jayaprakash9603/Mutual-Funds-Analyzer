package in.goldentriangle.mfa.adapter.out.featureflag;

import in.goldentriangle.mfa.domain.port.out.FeatureFlagPort;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Primary
public class RepositoryFeatureFlagAdapter implements FeatureFlagPort {

    private final ConfigFeatureFlagAdapter configAdapter;
    private final Map<String, Boolean> overrides = new ConcurrentHashMap<>();

    public RepositoryFeatureFlagAdapter(ConfigFeatureFlagAdapter configAdapter) {
        this.configAdapter = configAdapter;
    }

    @Override
    public boolean isEnabled(String key) {
        return override(key).orElseGet(() -> configAdapter.isEnabled(key));
    }

    @Override
    public Map<String, Boolean> allFlags() {
        Map<String, Boolean> flags = new HashMap<>(configAdapter.allFlags());
        flags.putAll(overrides);
        return flags;
    }

    @Override
    public Optional<Boolean> override(String key) {
        return Optional.ofNullable(overrides.get(key));
    }

    public void setOverride(String key, boolean enabled) {
        overrides.put(key, enabled);
    }
}
