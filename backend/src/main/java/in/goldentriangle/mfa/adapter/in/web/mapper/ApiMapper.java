package in.goldentriangle.mfa.adapter.in.web.mapper;

import in.goldentriangle.mfa.adapter.in.web.dto.FundIndexComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.dto.FundMetricsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.GoldenTriangleResultDto;
import in.goldentriangle.mfa.adapter.in.web.dto.PeriodComparisonRowDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RollingReturnRowDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RollingReturnsResponseDto;
import in.goldentriangle.mfa.adapter.in.web.dto.RuleResultDto;
import in.goldentriangle.mfa.adapter.in.web.dto.SeriesStatsDto;
import in.goldentriangle.mfa.adapter.in.web.dto.TimelineEventDto;
import in.goldentriangle.mfa.domain.model.FundIndexComparison;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.PeriodComparisonRow;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.RuleResult;
import in.goldentriangle.mfa.domain.model.SeriesStats;
import in.goldentriangle.mfa.domain.model.TimelineEvent;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ApiMapper {

    public FundIndexComparisonDto toDto(FundIndexComparison comparison) {
        return new FundIndexComparisonDto(
                comparison.scheme(),
                comparison.fundName(),
                comparison.benchmarkName(),
                comparison.category(),
                comparison.rows().stream().map(this::toDto).toList(),
                comparison.missingPeriods(),
                comparison.computedAt(),
                comparison.stale(),
                comparison.partial());
    }

    private PeriodComparisonRowDto toDto(PeriodComparisonRow row) {
        return new PeriodComparisonRowDto(
                row.period(),
                row.fundName(),
                row.benchmarkName(),
                toDto(row.fund()),
                toDto(row.benchmark()),
                row.cob(),
                row.totalRecords());
    }

    private SeriesStatsDto toDto(SeriesStats stats) {
        return new SeriesStatsDto(stats.avg(), stats.max(), stats.min(), stats.stdDev(), stats.count());
    }

    public RollingReturnsResponseDto toDto(RollingReturnsData data) {
        return new RollingReturnsResponseDto(
                data.fund().stream().map(this::toDto).toList(),
                data.benchmark().stream().map(this::toDto).toList());
    }

    public GoldenTriangleResultDto toDto(GoldenTriangleResult result) {
        return new GoldenTriangleResultDto(
                result.rules().stream().map(this::toDto).toList(),
                result.passCount(),
                result.overallRating().displayLabel(),
                result.passed(),
                toDto(result.metrics()),
                result.fundName(),
                result.benchmarkName(),
                result.category(),
                result.period());
    }

    public List<TimelineEventDto> toTimelineDtos(List<TimelineEvent> events) {
        return events.stream().map(this::toDto).toList();
    }

    public RollingReturnRowDto toDto(RollingReturnRow row) {
        return new RollingReturnRowDto(
                row.id(),
                row.schemeCompany(),
                row.schemeCategory(),
                row.schemeName(),
                row.period(),
                row.navDate(),
                row.schemeNav(),
                row.schemeForwardDate(),
                row.schemeForwardNav(),
                row.schemeRollingReturns());
    }

    private RuleResultDto toDto(RuleResult rule) {
        return new RuleResultDto(
                rule.idValue(),
                rule.label(),
                rule.passed(),
                rule.fundValue(),
                rule.benchmarkValue(),
                rule.description());
    }

    private FundMetricsDto toDto(FundMetrics metrics) {
        return new FundMetricsDto(
                metrics.fundRollingAvg(),
                metrics.benchmarkRollingAvg(),
                metrics.fundRollingMax(),
                metrics.fundRollingMin(),
                metrics.benchmarkRollingMax(),
                metrics.benchmarkRollingMin(),
                metrics.cob(),
                metrics.fundSharpe(),
                metrics.benchmarkSharpe(),
                metrics.fundAnnReturn(),
                metrics.benchmarkAnnReturn(),
                metrics.fundVolatility(),
                metrics.benchmarkVolatility(),
                metrics.alpha(),
                metrics.beta(),
                metrics.sortino(),
                metrics.treynor(),
                metrics.informationRatio(),
                metrics.maxDrawdown(),
                metrics.benchmarkMaxDrawdown(),
                metrics.totalReturn(),
                metrics.benchmarkTotalReturn(),
                metrics.riskLevel(),
                metrics.fundAgeYears(),
                metrics.consistencyScore());
    }

    private TimelineEventDto toDto(TimelineEvent event) {
        return new TimelineEventDto(
                event.title(),
                event.date(),
                event.value(),
                event.explanation(),
                event.sortKey());
    }
}
