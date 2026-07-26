package in.goldentriangle.mfa.domain.model;

import java.time.Instant;

public record FundReportSectionSnapshot(
        String scheme,
        String startDate,
        ReportSectionGroup sectionGroup,
        String payloadJson,
        Instant watermarkNavDate,
        Instant computedAt,
        int schemaVersion,
        long version) {
}
