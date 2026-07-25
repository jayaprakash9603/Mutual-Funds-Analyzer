package in.goldentriangle.mfa.domain.model;

import java.time.Instant;

public record AlignedRollingPoint(Instant date, double fundReturn, double benchmarkReturn) {
}
