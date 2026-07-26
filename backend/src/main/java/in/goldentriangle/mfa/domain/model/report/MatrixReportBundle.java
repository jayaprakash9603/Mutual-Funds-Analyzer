package in.goldentriangle.mfa.domain.model.report;

import java.time.Instant;

public record MatrixReportBundle(
        MatrixReport matrix,
        MatrixRecoveryAnalysis recovery,
        Instant lastNavDate,
        Instant computedAt,
        boolean fromSnapshot) {
}
