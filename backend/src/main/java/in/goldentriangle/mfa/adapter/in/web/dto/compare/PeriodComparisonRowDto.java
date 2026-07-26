package in.goldentriangle.mfa.adapter.in.web.dto.compare;

import in.goldentriangle.mfa.adapter.in.web.dto.rolling.SeriesStatsDto;
import in.goldentriangle.mfa.domain.model.Period;
public record PeriodComparisonRowDto(
        String period,
        String fundName,
        String benchmarkName,
        SeriesStatsDto fund,
        SeriesStatsDto benchmark,
        double cob,
        long totalRecords
) {
}
