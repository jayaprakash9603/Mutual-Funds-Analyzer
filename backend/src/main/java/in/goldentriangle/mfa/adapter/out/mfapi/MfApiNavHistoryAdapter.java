package in.goldentriangle.mfa.adapter.out.mfapi;

import com.fasterxml.jackson.core.type.TypeReference;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Component
@Primary
public class MfApiNavHistoryAdapter implements NavHistoryPort {

    private static final String CACHE_PREFIX = "mfapi-nav:";

    private final MfApiClient client;
    private final MfApiSchemeResolver schemeResolver;
    private final BenchmarkNavResolver benchmarkNavResolver;
    private final CachePort cachePort;

    public MfApiNavHistoryAdapter(
            MfApiClient client,
            MfApiSchemeResolver schemeResolver,
            BenchmarkNavResolver benchmarkNavResolver,
            CachePort cachePort) {
        this.client = client;
        this.schemeResolver = schemeResolver;
        this.benchmarkNavResolver = benchmarkNavResolver;
        this.cachePort = cachePort;
    }

    @Override
    public NavHistory fetch(String scheme, String startDate) {
        int code = schemeResolver.resolveCode(scheme);
        String apiStart = MfApiNavMapper.toApiStartDate(startDate);
        String cacheKey = CACHE_PREFIX + code + ":" + apiStart;
        return cachePort.getOrLoad(cacheKey, NavHistory.class, () -> load(scheme, code, apiStart, startDate));
    }

    private NavHistory load(String scheme, int code, String apiStart, String startDateUsed) {
        Map<String, Object> payload = client.get(
                "/mf/" + code,
                Map.of("startDate", apiStart),
                new TypeReference<>() {});

        MfApiNavMapper.MfApiMeta meta = MfApiNavMapper.parseMeta(castMap(payload.get("meta")));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) payload.get("data");
        if (data == null || data.isEmpty()) {
            throw new NoDataFoundException("No NAV history from mfapi for " + scheme);
        }

        List<NavPoint> fundNav = MfApiNavMapper.parseNavPoints(data);
        if (fundNav.isEmpty()) {
            throw new NoDataFoundException("No parseable NAV points for " + scheme);
        }

        BenchmarkNavResolver.BenchmarkSnapshot benchmark = benchmarkNavResolver.resolve(scheme, startDateUsed);
        Instant first = fundNav.stream().map(NavPoint::date).min(Comparator.naturalOrder()).orElse(Instant.EPOCH);
        Instant last = fundNav.stream().map(NavPoint::date).max(Comparator.naturalOrder()).orElse(Instant.EPOCH);

        return new NavHistory(
                scheme,
                meta.schemeName().isBlank() ? scheme : meta.schemeName(),
                benchmark.benchmarkName(),
                meta.schemeCategory(),
                meta.fundHouse(),
                fundNav,
                benchmark.benchmarkNav(),
                first,
                last,
                startDateUsed);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }
}
