package in.goldentriangle.mfa.domain.port.in;

import java.util.Map;

public interface GetFeatureFlagsUseCase {
    Map<String, Boolean> getFlags();
}
