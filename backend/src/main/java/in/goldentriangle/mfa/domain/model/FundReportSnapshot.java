package in.goldentriangle.mfa.domain.model;

import in.goldentriangle.mfa.domain.model.report.FundReport;

import java.time.Instant;

public record FundReportSnapshot(
        String scheme,
        String startDate,
        FundReport report,
        Instant watermarkNavDate,
        Instant computedAt,
        int schemaVersion,
        long version) {
}
