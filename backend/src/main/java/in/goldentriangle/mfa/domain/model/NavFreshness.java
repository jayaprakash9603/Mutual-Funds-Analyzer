package in.goldentriangle.mfa.domain.model;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

public record NavFreshness(Optional<Instant> watermark, boolean upstreamCheckDue) {

    public boolean matchesSnapshot(Instant storedWatermark) {
        if (storedWatermark == null) {
            return false;
        }
        if (upstreamCheckDue) {
            return false;
        }
        return watermark.isEmpty() || Objects.equals(storedWatermark, watermark.get());
    }
}
