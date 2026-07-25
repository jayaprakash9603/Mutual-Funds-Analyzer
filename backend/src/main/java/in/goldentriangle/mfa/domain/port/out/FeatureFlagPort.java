package in.goldentriangle.mfa.domain.port.out;

import java.util.Map;
import java.util.Optional;

public interface FeatureFlagPort {
    boolean isEnabled(String key);

    Map<String, Boolean> allFlags();

    Optional<Boolean> override(String key);
}
