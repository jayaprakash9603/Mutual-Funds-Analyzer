package in.goldentriangle.mfa.adapter.out.mfapi;

import com.fasterxml.jackson.core.type.TypeReference;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.NavStoreMapper;
import in.goldentriangle.mfa.application.sync.NavUpstreamSyncGate;
import in.goldentriangle.mfa.config.properties.MfApiProperties;
import in.goldentriangle.mfa.config.concurrency.KeyedLock;
import in.goldentriangle.mfa.domain.analytics.NavDateFormatter;
import in.goldentriangle.mfa.domain.analytics.NavPublicationCalendar;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.NavFreshness;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
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
import java.util.Objects;
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
    private final NavUpstreamSyncGate syncGate;
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
            NavUpstreamSyncGate syncGate,
            Clock clock,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor,
            KeyedLock navRefreshLock) {
        this.client = client;
        this.schemeResolver = schemeResolver;
        this.benchmarkNavResolver = benchmarkNavResolver;
        this.navStore = navStore;
        this.mfApiProperties = mfApiProperties;
        this.cachePort = cachePort;
        this.syncGate = syncGate;
        this.clock = clock;
        this.upstreamExecutor = upstreamExecutor;
        this.navRefreshLock = navRefreshLock;
    }

    @Override
    public NavHistory fetch(String scheme, String startDate) {
        int code = schemeResolver.resolveCode(scheme);
        String apiStart = MfApiNavMapper.toApiStartDate(startDate);
        String cacheKey = CACHE_PREFIX + code + ":" + apiStart;
        NavHistory history = cachePort.getOrLoad(cacheKey, NavHistory.class, () -> load(scheme, code, startDate, false));
        return alignWithStoredMeta(code, history);
    }

    @Override
    public NavHistory fetchFresh(String scheme, String startDate) {
        int code = schemeResolver.resolveCode(scheme);
        String apiStart = MfApiNavMapper.toApiStartDate(startDate);
        String cacheKey = CACHE_PREFIX + code + ":" + apiStart;
        cachePort.evict(cacheKey);
        NavHistory history = cachePort.getOrLoad(cacheKey, NavHistory.class, () -> load(scheme, code, startDate, true));
        return alignWithStoredMeta(code, history);
    }

    @Override
    public NavFreshness navFreshness(String scheme) {
        try {
            int code = schemeResolver.resolveCode(scheme);
            Optional<NavSeriesMeta> metaOpt = navStore.findMeta(code);
            if (metaOpt.isEmpty()) {
                return new NavFreshness(Optional.empty(), true);
            }
            NavSeriesMeta meta = metaOpt.get();
            List<NavPoint> benchmarkNav = navStore.loadPoints(code, NavSeries.BENCHMARK);
            boolean mfapiDue = shouldRefreshUpstream(meta, clock.instant());
            boolean investtDue = needsBenchmarkRepair(meta, benchmarkNav);
            boolean checkDue = syncGate.upstreamCheckDue(code, UpstreamSyncSource.MFAPI, mfapiDue)
                    || syncGate.upstreamCheckDue(code, UpstreamSyncSource.INVESTT, investtDue);
            return new NavFreshness(
                    Optional.ofNullable(meta.watermarkNavDate()),
                    checkDue);
        } catch (RuntimeException ex) {
            return new NavFreshness(Optional.empty(), true);
        }
    }

    private NavHistory load(String scheme, int code, String startDateUsed, boolean forceUpstream) {
        LoadedSeries loaded = ensureSeries(scheme, code, startDateUsed, forceUpstream);
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

    private NavHistory alignWithStoredMeta(int code, NavHistory history) {
        return navStore.findMeta(code)
                .filter(meta -> meta.benchmarkName() != null
                        && !Objects.equals(meta.benchmarkName(), history.benchmarkName()))
                .map(meta -> new NavHistory(
                        history.scheme(),
                        history.fundName(),
                        meta.benchmarkName(),
                        history.category(),
                        history.amc(),
                        history.fundNav(),
                        history.benchmarkNav(),
                        history.firstNavDate(),
                        history.lastNavDate(),
                        history.startDateUsed()))
                .orElse(history);
    }

    private void evictNavHistoryCache(int code, String startDateUsed) {
        cachePort.evict(CACHE_PREFIX + code + ":" + MfApiNavMapper.toApiStartDate(startDateUsed));
    }

    private LoadedSeries ensureSeries(String scheme, int code, String startDateUsed, boolean forceUpstream) {
        return navRefreshLock.call(Integer.toString(code), () -> doEnsureSeries(scheme, code, startDateUsed, forceUpstream));
    }

    private LoadedSeries doEnsureSeries(String scheme, int code, String startDateUsed, boolean forceUpstream) {
        Instant now = clock.instant();
        Optional<NavSeriesMeta> metaOpt = navStore.findMeta(code);

        if (metaOpt.isEmpty()) {
            if (!syncGate.shouldFetchFromUpstream(code, UpstreamSyncSource.MFAPI)) {
                throw new NoDataFoundException("No NAV history available for " + scheme);
            }
            return fullRefresh(scheme, code, startDateUsed, now, 0L, null);
        }

        NavSeriesMeta meta = metaOpt.get();
        boolean legacyDue = forceUpstream || shouldRefreshUpstream(meta, now);
        boolean fetchMfapi = legacyDue && syncGate.shouldFetchFromUpstream(code, UpstreamSyncSource.MFAPI);

        List<NavPoint> fundNav = navStore.loadPoints(code, NavSeries.FUND);
        List<NavPoint> benchmarkNav = navStore.loadPoints(code, NavSeries.BENCHMARK);
        boolean repairBenchmark = needsBenchmarkRepair(meta, benchmarkNav)
                && syncGate.shouldFetchFromUpstream(code, UpstreamSyncSource.INVESTT);

        if (fetchMfapi || repairBenchmark) {
            if (fetchMfapi) {
                benchmarkNavResolver.evict(scheme, startDateUsed);
            }
            return deltaRefresh(scheme, code, startDateUsed, meta, now, fetchMfapi, repairBenchmark || fetchMfapi);
        }

        if (fundNav.isEmpty()) {
            if (syncGate.shouldFetchFromUpstream(code, UpstreamSyncSource.MFAPI)) {
                return fullRefresh(scheme, code, startDateUsed, now, meta.version(), meta);
            }
            throw new NoDataFoundException("No NAV history available for " + scheme);
        }
        return new LoadedSeries(meta, fundNav, benchmarkNav);
    }

    private static boolean needsBenchmarkRepair(NavSeriesMeta meta, List<NavPoint> benchmarkNav) {
        return benchmarkNav.isEmpty()
                || BenchmarkNavResolver.UNAVAILABLE_LABEL.equals(meta.benchmarkName());
    }

    private LoadedSeries fullRefresh(
            String scheme,
            int code,
            String startDateUsed,
            Instant now,
            long version,
            NavSeriesMeta existingMeta) {
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
                mergeBenchmarkName(existingMeta, benchmark),
                fundFetch.meta().schemeCategory(),
                fundFetch.meta().fundHouse(),
                NavStoreMapper.minDate(fundFetch.points()),
                NavStoreMapper.maxDate(fundFetch.points()),
                NavStoreMapper.maxDate(benchmark.benchmarkNav()),
                now,
                version));

        evictNavHistoryCache(code, startDateUsed);
        return loadedFromStore(code, meta, fundFetch.points(), benchmark.benchmarkNav());
    }

    private LoadedSeries deltaRefresh(
            String scheme,
            int code,
            String startDateUsed,
            NavSeriesMeta meta,
            Instant now,
            boolean fetchMfapi,
            boolean fetchBenchmark) {
        String fundDeltaStart = meta.watermarkNavDate() == null
                ? startDateUsed
                : NavDateFormatter.dayAfter(meta.watermarkNavDate());
        String fundApiStart = MfApiNavMapper.toApiStartDate(fundDeltaStart);

        CompletableFuture<BenchmarkNavResolver.BenchmarkSnapshot> benchmarkFuture = fetchBenchmark
                ? CompletableFuture.supplyAsync(
                        () -> benchmarkNavResolver.resolve(scheme, startDateUsed),
                        upstreamExecutor)
                : CompletableFuture.completedFuture(
                        new BenchmarkNavResolver.BenchmarkSnapshot(meta.benchmarkName(), List.of()));

        List<NavPoint> deltaFund = fetchMfapi
                ? tryFetchFundNav(code, fundApiStart)
                        .map(FundFetchResult::points)
                        .orElse(List.of())
                : List.of();
        BenchmarkNavResolver.BenchmarkSnapshot benchmark = benchmarkFuture.join();

        if (fetchMfapi
                && deltaFund.isEmpty()
                && NavPublicationCalendar.isWatermarkBehind(meta.watermarkNavDate(), clock)) {
            return fullRefresh(scheme, code, startDateUsed, now, meta.version(), meta);
        }

        if (!deltaFund.isEmpty()) {
            navStore.append(code, NavSeries.FUND, deltaFund);
        }
        List<NavPoint> benchmarkDelta = benchmark.benchmarkNav();
        if (fetchBenchmark && meta.benchmarkWatermarkNavDate() != null) {
            Instant afterWatermark = meta.benchmarkWatermarkNavDate();
            benchmarkDelta = benchmarkDelta.stream()
                    .filter(point -> point.date().isAfter(afterWatermark))
                    .toList();
        }
        if (!benchmarkDelta.isEmpty()) {
            navStore.append(code, NavSeries.BENCHMARK, benchmarkDelta);
        }

        Instant fundWatermark = fetchMfapi
                ? latest(meta.watermarkNavDate(), NavStoreMapper.maxDate(deltaFund))
                : meta.watermarkNavDate();
        Instant benchWatermark = fetchBenchmark
                ? latest(meta.benchmarkWatermarkNavDate(), NavStoreMapper.maxDate(benchmarkDelta))
                : meta.benchmarkWatermarkNavDate();

        NavSeriesMeta updated = navStore.saveMeta(new NavSeriesMeta(
                code,
                scheme,
                meta.fundName(),
                mergeBenchmarkName(meta, benchmark),
                meta.category(),
                meta.amc(),
                meta.firstNavDate() != null ? meta.firstNavDate() : NavStoreMapper.minDate(deltaFund),
                fundWatermark,
                benchWatermark,
                fetchMfapi || fetchBenchmark ? now : meta.refreshedAt(),
                meta.version()));

        evictNavHistoryCache(code, startDateUsed);
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
        syncGate.beginAttempt(code, UpstreamSyncSource.MFAPI);
        try {
            Map<String, Object> payload = client.get(
                    "/mf/" + code,
                    Map.of("startDate", apiStart),
                    new TypeReference<>() {});

            MfApiNavMapper.MfApiMeta meta = MfApiNavMapper.parseMeta(castMap(payload.get("meta")));
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) payload.get("data");
            if (data == null || data.isEmpty()) {
                syncGate.markSuccess(code, UpstreamSyncSource.MFAPI);
                return Optional.empty();
            }

            List<NavPoint> points = MfApiNavMapper.parseNavPoints(data);
            if (points.isEmpty()) {
                syncGate.markSuccess(code, UpstreamSyncSource.MFAPI);
                return Optional.empty();
            }
            syncGate.markSuccess(code, UpstreamSyncSource.MFAPI);
            return Optional.of(new FundFetchResult(meta, points));
        } catch (RuntimeException ex) {
            syncGate.markFailure(code, UpstreamSyncSource.MFAPI, ex.getMessage());
            throw ex;
        }
    }

    private FundFetchResult fetchFundNav(int code, String apiStart) {
        return tryFetchFundNav(code, apiStart)
                .orElseThrow(() -> new NoDataFoundException("No NAV history from mfapi for scheme code " + code));
    }

    private boolean shouldRefreshUpstream(NavSeriesMeta meta, Instant now) {
        return isStale(meta, now) || NavPublicationCalendar.isWatermarkBehind(meta.watermarkNavDate(), clock);
    }

    private boolean isStale(NavSeriesMeta meta, Instant now) {
        Duration ttl = mfApiProperties.navTtl();
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            return true;
        }
        return meta.refreshedAt().plus(ttl).isBefore(now);
    }

    private static String mergeBenchmarkName(NavSeriesMeta meta, BenchmarkNavResolver.BenchmarkSnapshot benchmark) {
        if (BenchmarkNavResolver.isAvailable(benchmark)) {
            return benchmark.benchmarkName();
        }
        if (meta != null) {
            String existing = meta.benchmarkName();
            if (existing != null && !existing.isBlank()
                    && !BenchmarkNavResolver.UNAVAILABLE_LABEL.equals(existing)) {
                return existing;
            }
        }
        return benchmark.benchmarkName();
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

