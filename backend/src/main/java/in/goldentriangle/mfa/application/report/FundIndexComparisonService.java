package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.AggregateFolder;
import in.goldentriangle.mfa.domain.analytics.NavDateFormatter;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundIndexComparison;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.PeriodComparisonRow;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.port.in.GetFundIndexComparisonUseCase;
import in.goldentriangle.mfa.domain.port.out.RollingAggregatePort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class FundIndexComparisonService implements GetFundIndexComparisonUseCase {

    private static final Logger log = LoggerFactory.getLogger(FundIndexComparisonService.class);

    /**
     * Fixed set of monitors keyed by hash, so concurrent requests for the same scheme and period
     * serialise without the key map growing for the lifetime of the JVM.
     */
    private static final int LOCK_STRIPES = 64;

    private final RollingReturnsPort rollingReturnsPort;
    private final RollingAggregatePort aggregatePort;
    private final FeatureFlags featureFlags;
    private final FeatureGuard featureGuard;
    private final AnalyticsProperties analyticsProperties;
    private final UpstreamProperties upstreamProperties;
    private final Clock clock;
    private final Executor upstreamExecutor;
    private final Object[] locks = createLocks();

    public FundIndexComparisonService(
            RollingReturnsPort rollingReturnsPort,
            RollingAggregatePort aggregatePort,
            FeatureFlags featureFlags,
            FeatureGuard featureGuard,
            AnalyticsProperties analyticsProperties,
            UpstreamProperties upstreamProperties,
            Clock clock,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.aggregatePort = aggregatePort;
        this.featureFlags = featureFlags;
        this.featureGuard = featureGuard;
        this.analyticsProperties = analyticsProperties;
        this.upstreamProperties = upstreamProperties;
        this.clock = clock;
        this.upstreamExecutor = upstreamExecutor;
    }

    @Override
    public FundIndexComparison get(String scheme, String startDate) {
        featureGuard.require(FeatureKeys.ANALYSIS_FUND_INDEX_MATRIX);

        String resolvedStartDate = resolveStartDate(startDate);
        List<Period> periods = configuredPeriods();
        List<PeriodResult> results = resolveAllPeriods(scheme, periods, resolvedStartDate);

        return assemble(scheme, periods, results);
    }

    private String resolveStartDate(String startDate) {
        return startDate == null || startDate.isBlank()
                ? upstreamProperties.defaultStartDate()
                : startDate;
    }

    private List<Period> configuredPeriods() {
        return analyticsProperties.matrixPeriods().stream()
                .map(Period::fromLabel)
                .toList();
    }

    /**
     * Each period is fetched on its own thread so the widest window does not gate the whole table.
     * A period that fails is reported in {@code missingPeriods} rather than failing the request.
     */
    private List<PeriodResult> resolveAllPeriods(String scheme, List<Period> periods, String startDate) {
        List<CompletableFuture<PeriodResult>> futures = periods.stream()
                .map(period -> CompletableFuture.supplyAsync(
                        () -> resolvePeriod(scheme, period, startDate),
                        upstreamExecutor))
                .toList();

        List<PeriodResult> results = new ArrayList<>();
        for (int i = 0; i < futures.size(); i++) {
            Period period = periods.get(i);
            try {
                results.add(futures.get(i).join());
            } catch (Exception ex) {
                log.warn("Fund index matrix period failed for scheme={} period={}", scheme, period.label(), ex);
                results.add(null);
            }
        }
        return results;
    }

    private FundIndexComparison assemble(String scheme, List<Period> periods, List<PeriodResult> results) {
        List<PeriodComparisonRow> rows = new ArrayList<>();
        List<String> missingPeriods = new ArrayList<>();
        boolean partial = false;
        boolean stale = false;
        Instant latestComputedAt = Instant.EPOCH;
        RollingAggregate identity = null;

        for (int i = 0; i < results.size(); i++) {
            PeriodResult result = results.get(i);
            if (result == null) {
                partial = true;
                missingPeriods.add(periods.get(i).label());
                continue;
            }
            RollingAggregate aggregate = result.aggregate();
            if (aggregate.fundStats().count() == 0) {
                missingPeriods.add(periods.get(i).label());
                continue;
            }
            rows.add(aggregate.toComparisonRow());
            if (identity == null) {
                identity = aggregate;
            }
            stale = stale || result.stale();
            if (aggregate.computedAt().isAfter(latestComputedAt)) {
                latestComputedAt = aggregate.computedAt();
            }
        }

        rows.sort(Comparator.comparingInt(row -> Period.fromLabel(row.period()).years()));

        return new FundIndexComparison(
                scheme,
                identity == null ? "" : identity.fundName(),
                identity == null ? "" : identity.benchmarkName(),
                identity == null ? "" : identity.category(),
                rows,
                missingPeriods,
                latestComputedAt.equals(Instant.EPOCH) ? clock.instant() : latestComputedAt,
                stale,
                partial);
    }

    private PeriodResult resolvePeriod(String scheme, Period period, String startDate) {
        synchronized (lockFor(scheme, period)) {
            boolean incremental = featureFlags.getAnalysis().isIncrementalAggregates();
            Optional<RollingAggregate> stored = aggregatePort.find(scheme, period);

            if (stored.isPresent() && incremental) {
                RollingAggregate existing = stored.get();
                if (isFresh(existing)) {
                    return new PeriodResult(existing, false);
                }
                if (existing.watermarkNavDate() != null) {
                    RollingAggregate refreshed = refreshDelta(scheme, period, existing);
                    return new PeriodResult(refreshed, !isFresh(refreshed));
                }
            }

            return new PeriodResult(foldFromInception(scheme, period, startDate), false);
        }
    }

    private RollingAggregate foldFromInception(String scheme, Period period, String startDate) {
        RollingReturnsData data = rollingReturnsPort.fetch(new AnalysisQuery(scheme, period, startDate));
        if (data.fund().isEmpty() && data.benchmark().isEmpty()) {
            throw new NoDataFoundException("No rolling return data for " + period.label());
        }
        RollingAggregate folded = AggregateFolder.fold(scheme, period, data, null, clock.instant());
        return aggregatePort.save(folded);
    }

    private RollingAggregate refreshDelta(String scheme, Period period, RollingAggregate existing) {
        String deltaStart = NavDateFormatter.dayAfter(existing.watermarkNavDate());
        RollingReturnsData delta = rollingReturnsPort.fetch(new AnalysisQuery(scheme, period, deltaStart));
        RollingAggregate folded =
                AggregateFolder.fold(scheme, period, delta, existing.watermarkNavDate(), clock.instant());
        if (folded.fundStats().count() == 0 && folded.indexStats().count() == 0) {
            return aggregatePort.save(existing.withComputedAt(clock.instant()));
        }
        return aggregatePort.save(AggregateFolder.merge(existing, folded, clock.instant()));
    }

    private boolean isFresh(RollingAggregate aggregate) {
        Duration refreshAfter = analyticsProperties.refreshAfter();
        return aggregate.computedAt().isAfter(clock.instant().minus(refreshAfter));
    }

    private Object lockFor(String scheme, Period period) {
        int index = Math.floorMod((scheme + "::" + period.label()).hashCode(), LOCK_STRIPES);
        return locks[index];
    }

    private static Object[] createLocks() {
        Object[] created = new Object[LOCK_STRIPES];
        for (int i = 0; i < LOCK_STRIPES; i++) {
            created[i] = new Object();
        }
        return created;
    }

    private record PeriodResult(RollingAggregate aggregate, boolean stale) {
    }
}
