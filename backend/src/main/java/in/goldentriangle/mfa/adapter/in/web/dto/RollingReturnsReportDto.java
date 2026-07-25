package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record RollingReturnsReportDto(List<PeriodRollingStatsDto> periods, double consistencyScore) {

    public record PeriodRollingStatsDto(
            String periodLabel,
            double average,
            double maximum,
            double minimum,
            double median,
            double percentAbove10,
            double percentAbove7,
            double percentNegative) {
    }
}
