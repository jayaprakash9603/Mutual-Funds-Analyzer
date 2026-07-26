package in.goldentriangle.mfa.adapter.out.mfapi;

import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
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
    private static final String CACHE_PREFIX = "benchmark-nav:v1:";

    private final RollingReturnsPort rollingReturnsPort;
    private final CachePort cachePort;

    public BenchmarkNavResolver(
            @Qualifier("upstreamRollingReturnsPort") RollingReturnsPort rollingReturnsPort,
            CachePort cachePort) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.cachePort = cachePort;
    }

    public BenchmarkSnapshot resolve(String schemeName, String startDate) {
        String cacheKey = CACHE_PREFIX + schemeName + ":" + startDate;
        return cachePort.getOrLoad(cacheKey, BenchmarkSnapshot.class, () -> load(schemeName, startDate));
    }

    private BenchmarkSnapshot load(String schemeName, String startDate) {
        try {
            RollingReturnsData data = rollingReturnsPort.fetch(
                    new AnalysisQuery(schemeName, Period.ONE_YEAR, startDate));
            List<NavPoint> benchmarkNav = NavSeriesBuilder.buildNavSeries(data.benchmark());
            String benchmarkName = data.benchmark().stream()
                    .map(RollingReturnRow::schemeName)
                    .filter(name -> name != null && !name.isBlank())
                    .findFirst()
                    .orElse("Benchmark");
            return new BenchmarkSnapshot(benchmarkName, benchmarkNav);
        } catch (RuntimeException ex) {
            log.warn("Benchmark bridge unavailable for {}: {}", schemeName, ex.getMessage());
            return new BenchmarkSnapshot("Benchmark unavailable", List.of());
        }
    }

    public record BenchmarkSnapshot(String benchmarkName, List<NavPoint> benchmarkNav) {
    }
}
