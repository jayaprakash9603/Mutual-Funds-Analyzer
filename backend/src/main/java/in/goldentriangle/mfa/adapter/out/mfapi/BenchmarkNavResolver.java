package in.goldentriangle.mfa.adapter.out.mfapi;

import in.goldentriangle.mfa.application.sync.NavUpstreamSyncGate;
import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BenchmarkNavResolver {

    private static final Logger log = LoggerFactory.getLogger(BenchmarkNavResolver.class);
    private static final String CACHE_PREFIX = "benchmark-nav:v2:";
    static final String UNAVAILABLE_LABEL = "Benchmark unavailable";

    private final RollingReturnsPort rollingReturnsPort;
    private final MfApiSchemeResolver schemeResolver;
    private final NavUpstreamSyncGate syncGate;
    private final CachePort cachePort;

    public BenchmarkNavResolver(
            @Qualifier("upstreamRollingReturnsPort") RollingReturnsPort rollingReturnsPort,
            MfApiSchemeResolver schemeResolver,
            NavUpstreamSyncGate syncGate,
            CachePort cachePort) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.schemeResolver = schemeResolver;
        this.syncGate = syncGate;
        this.cachePort = cachePort;
    }

    public BenchmarkSnapshot resolve(String schemeName, String startDate) {
        String cacheKey = cacheKey(schemeName, startDate);
        var cached = cachePort.get(cacheKey, BenchmarkSnapshot.class);
        if (cached.isPresent() && isAvailable(cached.get())) {
            return cached.get();
        }
        if (cached.isPresent()) {
            cachePort.evict(cacheKey);
        }

        int schemeCode = schemeResolver.resolveCode(schemeName);
        if (!syncGate.shouldFetchFromUpstream(schemeCode, UpstreamSyncSource.INVESTT)) {
            return cached.orElse(new BenchmarkSnapshot(UNAVAILABLE_LABEL, List.of()));
        }

        BenchmarkSnapshot loaded = load(schemeCode, schemeName, startDate);
        if (isAvailable(loaded)) {
            return cachePort.getOrLoad(cacheKey, BenchmarkSnapshot.class, () -> loaded);
        }
        return loaded;
    }

    public void evict(String schemeName, String startDate) {
        cachePort.evict(cacheKey(schemeName, startDate));
    }

    private BenchmarkSnapshot load(int schemeCode, String schemeName, String startDate) {
        syncGate.beginAttempt(schemeCode, UpstreamSyncSource.INVESTT);
        try {
            RollingReturnsData data = rollingReturnsPort.fetch(
                    new AnalysisQuery(schemeName, Period.ONE_YEAR, startDate));
            List<NavPoint> benchmarkNav = NavSeriesBuilder.buildNavSeries(data.benchmark());
            if (benchmarkNav.isEmpty()) {
                log.warn("Investt benchmark series empty for {}", schemeName);
                syncGate.markFailure(schemeCode, UpstreamSyncSource.INVESTT, "Investt benchmark series empty");
                return new BenchmarkSnapshot(UNAVAILABLE_LABEL, List.of());
            }
            String benchmarkName = data.benchmark().stream()
                    .map(RollingReturnRow::schemeName)
                    .filter(name -> name != null && !name.isBlank())
                    .findFirst()
                    .orElse("Benchmark");
            syncGate.markSuccess(schemeCode, UpstreamSyncSource.INVESTT);
            return new BenchmarkSnapshot(benchmarkName, benchmarkNav);
        } catch (RuntimeException ex) {
            syncGate.markFailure(schemeCode, UpstreamSyncSource.INVESTT, ex.getMessage());
            log.warn("Benchmark bridge unavailable for {}: {}", schemeName, ex.getMessage());
            return new BenchmarkSnapshot(UNAVAILABLE_LABEL, List.of());
        }
    }

    static boolean isAvailable(BenchmarkSnapshot snapshot) {
        return snapshot != null
                && !snapshot.benchmarkNav().isEmpty()
                && !UNAVAILABLE_LABEL.equals(snapshot.benchmarkName());
    }

    private static String cacheKey(String schemeName, String startDate) {
        return CACHE_PREFIX + schemeName + ":" + startDate;
    }

    public record BenchmarkSnapshot(String benchmarkName, List<NavPoint> benchmarkNav) {
    }
}
