package in.goldentriangle.mfa.adapter.out.mfapi;

import com.fasterxml.jackson.core.type.TypeReference;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.NavStoreMapper;
import in.goldentriangle.mfa.config.properties.MfApiProperties;
import in.goldentriangle.mfa.config.concurrency.KeyedLock;
import in.goldentriangle.mfa.domain.analytics.NavDateFormatter;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import in.goldentriangle.mfa.domain.port.out.NavStorePort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Component
@Primary
public class MfApiNavHistoryAdapter implements NavHistoryPort {

    private static final String CACHE_PREFIX = "mfapi-nav:";

    private final MfApiClient client;
    private final MfApiSchemeResolver schemeResolver;
    private final BenchmarkNavResolver benchmarkNavResolver;
    private final NavStorePort navStore;
    private final MfApiProperties mfApiProperties;
    private final CachePort cachePort;
    private final Clock clock;
    private final Executor upstreamExecutor;
    private final KeyedLock navRefreshLock;

    public MfApiNavHistoryAdapter(
            MfApiClient client,
            MfApiSchemeResolver schemeResolver,
            BenchmarkNavResolver benchmarkNavResolver,
            NavStorePort navStore,
            MfApiProperties mfApiProperties,
            CachePort cachePort,
            Clock clock,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor,
            KeyedLock navRefreshLock) {
        this.client = client;
        this.schemeResolver = schemeResolver;
        this.benchmarkNavResolver = benchmarkNavResolver;
        this.navStore = navStore;
        this.mfApiProperties = mfApiProperties;
        this.cachePort = cachePort;
        this.clock = clock;
        this.upstreamExecutor = upstreamExecutor;
        this.navRefreshLock = navRefreshLock;
    }

    @Override
    public NavHistory fetch(String scheme, String startDate) {
        int code = schemeResolver.resolveCode(scheme);
        String apiStart = MfApiNavMapper.toApiStartDate(startDate);
        String cacheKey = CACHE_PREFIX + code + ":" + apiStart;
        return cachePort.getOrLoad(cacheKey, NavHistory.class, () -> load(scheme, code, startDate));
    }

    @Override
    public Optional<Instant> latestNavWatermark(String scheme) {
        try {
            int code = schemeResolver.resolveCode(scheme);
            return navStore.findMeta(code).map(NavSeriesMeta::watermarkNavDate);
        } catch (RuntimeException ex) {
            return Optional.empty();
        }
    }

    private NavHistory load(String scheme, int code, String startDateUsed) {
        LoadedSeries loaded = ensureSeries(scheme, code, startDateUsed);
        Instant cutoff = NavStoreMapper.parseStartDate(startDateUsed);
        List<NavPoint> fundNav = navStore.loadPoints(code, NavSeries.FUND, cutoff);
        List<NavPoint> benchmarkNav = navStore.loadPoints(code, NavSeries.BENCHMARK, cutoff);

        if (fundNav.isEmpty()) {
            throw new NoDataFoundException("No NAV history available for " + scheme);
        }

        Instant first = fundNav.stream().map(NavPoint::date).min(Comparator.naturalOrder()).orElse(Instant.EPOCH);
        Instant last = fundNav.stream().map(NavPoint::date).max(Comparator.naturalOrder()).orElse(Instant.EPOCH);
        NavSeriesMeta meta = loaded.meta();

        return new NavHistory(
                scheme,
                meta.fundName().isBlank() ? scheme : meta.fundName(),
                meta.benchmarkName(),
                meta.category(),
                meta.amc(),
                fundNav,
                benchmarkNav,
                first,
                last,
                startDateUsed);
    }

    private LoadedSeries ensureSeries(String scheme, int code, String startDateUsed) {
        return navRefreshLock.call(Integer.toString(code), () -> doEnsureSeries(scheme, code, startDateUsed));
    }

    private LoadedSeries doEnsureSeries(String scheme, int code, String startDateUsed) {
        Instant now = clock.instant();
        Optional<NavSeriesMeta> metaOpt = navStore.findMeta(code);

        if (metaOpt.isEmpty()) {
            return fullRefresh(scheme, code, startDateUsed, now, 0L);
        }

        NavSeriesMeta meta = metaOpt.get();
        if (isStale(meta, now)) {
            return deltaRefresh(scheme, code, startDateUsed, meta, now);
        }

        List<NavPoint> fundNav = navStore.loadPoints(code, NavSeries.FUND);
        List<NavPoint> benchmarkNav = navStore.loadPoints(code, NavSeries.BENCHMARK);
        if (fundNav.isEmpty()) {
            return fullRefresh(scheme, code, startDateUsed, now, meta.version());
        }
        return new LoadedSeries(meta, fundNav, benchmarkNav);
    }

    private LoadedSeries fullRefresh(String scheme, int code, String startDateUsed, Instant now, long version) {
        String apiStart = MfApiNavMapper.toApiStartDate(startDateUsed);
        CompletableFuture<BenchmarkNavResolver.BenchmarkSnapshot> benchmarkFuture = CompletableFuture.supplyAsync(
                () -> benchmarkNavResolver.resolve(scheme, startDateUsed),
                upstreamExecutor);

        FundFetchResult fundFetch = fetchFundNav(code, apiStart);
        BenchmarkNavResolver.BenchmarkSnapshot benchmark = benchmarkFuture.join();

        navStore.append(code, NavSeries.FUND, fundFetch.points());
        navStore.append(code, NavSeries.BENCHMARK, benchmark.benchmarkNav());

        NavSeriesMeta meta = navStore.saveMeta(new NavSeriesMeta(
                code,
                scheme,
                fundFetch.meta().schemeName(),
                benchmark.benchmarkName(),
                fundFetch.meta().schemeCategory(),
                fundFetch.meta().fundHouse(),
                NavStoreMapper.minDate(fundFetch.points()),
                NavStoreMapper.maxDate(fundFetch.points()),
                NavStoreMapper.maxDate(benchmark.benchmarkNav()),
                now,
                version));

        return loadedFromStore(code, meta, fundFetch.points(), benchmark.benchmarkNav());
    }

    private LoadedSeries deltaRefresh(String scheme, int code, String startDateUsed, NavSeriesMeta meta, Instant now) {
        String fundDeltaStart = meta.watermarkNavDate() == null
                ? startDateUsed
                : NavDateFormatter.dayAfter(meta.watermarkNavDate());
        String fundApiStart = MfApiNavMapper.toApiStartDate(fundDeltaStart);

        CompletableFuture<BenchmarkNavResolver.BenchmarkSnapshot> benchmarkFuture = CompletableFuture.supplyAsync(
                () -> {
                    String benchStart = meta.benchmarkWatermarkNavDate() == null
                            ? startDateUsed
                            : NavDateFormatter.dayAfter(meta.benchmarkWatermarkNavDate());
                    return benchmarkNavResolver.resolve(scheme, benchStart);
                },
                upstreamExecutor);

        List<NavPoint> deltaFund = tryFetchFundNav(code, fundApiStart)
                .map(FundFetchResult::points)
                .orElse(List.of());
        BenchmarkNavResolver.BenchmarkSnapshot benchmark = benchmarkFuture.join();

        if (!deltaFund.isEmpty()) {
            navStore.append(code, NavSeries.FUND, deltaFund);
        }
        if (!benchmark.benchmarkNav().isEmpty()) {
            navStore.append(code, NavSeries.BENCHMARK, benchmark.benchmarkNav());
        }

        Instant fundWatermark = latest(meta.watermarkNavDate(), NavStoreMapper.maxDate(deltaFund));
        Instant benchWatermark = latest(meta.benchmarkWatermarkNavDate(), NavStoreMapper.maxDate(benchmark.benchmarkNav()));

        NavSeriesMeta updated = navStore.saveMeta(new NavSeriesMeta(
                code,
                scheme,
                meta.fundName(),
                benchmark.benchmarkName().isBlank() ? meta.benchmarkName() : benchmark.benchmarkName(),
                meta.category(),
                meta.amc(),
                meta.firstNavDate() != null ? meta.firstNavDate() : NavStoreMapper.minDate(deltaFund),
                fundWatermark,
                benchWatermark,
                now,
                meta.version()));

        List<NavPoint> fundNav = navStore.loadPoints(code, NavSeries.FUND);
        List<NavPoint> benchmarkNav = navStore.loadPoints(code, NavSeries.BENCHMARK);
        if (fundNav.isEmpty()) {
            fundNav = deltaFund;
            benchmarkNav = benchmark.benchmarkNav();
        }
        return new LoadedSeries(updated, fundNav, benchmarkNav);
    }

    private LoadedSeries loadedFromStore(
            int code,
            NavSeriesMeta meta,
            List<NavPoint> fallbackFund,
            List<NavPoint> fallbackBenchmark) {
        List<NavPoint> fundNav = navStore.loadPoints(code, NavSeries.FUND);
        List<NavPoint> benchmarkNav = navStore.loadPoints(code, NavSeries.BENCHMARK);
        if (fundNav.isEmpty()) {
            return new LoadedSeries(meta, fallbackFund, fallbackBenchmark);
        }
        return new LoadedSeries(meta, fundNav, benchmarkNav);
    }

    private Optional<FundFetchResult> tryFetchFundNav(int code, String apiStart) {
        Map<String, Object> payload = client.get(
                "/mf/" + code,
                Map.of("startDate", apiStart),
                new TypeReference<>() {});

        MfApiNavMapper.MfApiMeta meta = MfApiNavMapper.parseMeta(castMap(payload.get("meta")));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) payload.get("data");
        if (data == null || data.isEmpty()) {
            return Optional.empty();
        }

        List<NavPoint> points = MfApiNavMapper.parseNavPoints(data);
        if (points.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new FundFetchResult(meta, points));
    }

    private FundFetchResult fetchFundNav(int code, String apiStart) {
        return tryFetchFundNav(code, apiStart)
                .orElseThrow(() -> new NoDataFoundException("No NAV history from mfapi for scheme code " + code));
    }

    private boolean isStale(NavSeriesMeta meta, Instant now) {
        Duration ttl = mfApiProperties.navTtl();
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            return true;
        }
        return meta.refreshedAt().plus(ttl).isBefore(now);
    }

    private static Instant latest(Instant current, Instant candidate) {
        if (candidate == null) {
            return current;
        }
        if (current == null) {
            return candidate;
        }
        return candidate.isAfter(current) ? candidate : current;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private record FundFetchResult(MfApiNavMapper.MfApiMeta meta, List<NavPoint> points) {
    }

    private record LoadedSeries(NavSeriesMeta meta, List<NavPoint> fundNav, List<NavPoint> benchmarkNav) {
    }
}
