package in.goldentriangle.mfa.domain.model;

import java.time.Instant;
import java.util.List;

public record FundIndexComparison(
        String scheme,
        String fundName,
        String benchmarkName,
        String category,
        List<PeriodComparisonRow> rows,
        List<String> missingPeriods,
        Instant computedAt,
        boolean stale,
        boolean partial
) {
}
