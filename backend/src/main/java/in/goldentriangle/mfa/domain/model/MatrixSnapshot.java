package in.goldentriangle.mfa.domain.model;

import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;

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
