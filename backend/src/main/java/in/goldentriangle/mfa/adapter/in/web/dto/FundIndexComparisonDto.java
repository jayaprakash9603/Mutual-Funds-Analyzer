package in.goldentriangle.mfa.adapter.in.web.dto;

import java.time.Instant;
import java.util.List;

public record FundIndexComparisonDto(
        String scheme,
        String fundName,
        String benchmarkName,
        String category,
        List<PeriodComparisonRowDto> rows,
        List<String> missingPeriods,
        Instant computedAt,
        boolean stale,
        boolean partial
) {
}
