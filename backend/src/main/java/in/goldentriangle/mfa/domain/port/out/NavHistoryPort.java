package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.report.NavHistory;

import java.time.Instant;
import java.util.Optional;

public interface NavHistoryPort {

    NavHistory fetch(String scheme, String startDate);

    default Optional<Instant> latestNavWatermark(String scheme) {
        return Optional.empty();
    }
}
