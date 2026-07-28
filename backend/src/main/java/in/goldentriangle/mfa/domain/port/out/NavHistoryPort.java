package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.NavFreshness;
import in.goldentriangle.mfa.domain.model.report.NavHistory;

import java.time.Instant;
import java.util.Optional;

public interface NavHistoryPort {

    NavHistory fetch(String scheme, String startDate);

    default NavHistory fetchFresh(String scheme, String startDate) {
        return fetch(scheme, startDate);
    }

    default Optional<Instant> latestNavWatermark(String scheme) {
        return navFreshness(scheme).watermark();
    }

    default NavFreshness navFreshness(String scheme) {
        return new NavFreshness(Optional.empty(), false);
    }
}
