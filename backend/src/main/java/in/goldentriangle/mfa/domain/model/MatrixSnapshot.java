package in.goldentriangle.mfa.domain.model;

import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;

import java.time.Instant;

public record MatrixSnapshot(
        String scheme,
        MatrixMode mode,
        String startDate,
        MatrixReport report,
        Instant watermarkNavDate,
        Instant computedAt,
        long version) {
}
