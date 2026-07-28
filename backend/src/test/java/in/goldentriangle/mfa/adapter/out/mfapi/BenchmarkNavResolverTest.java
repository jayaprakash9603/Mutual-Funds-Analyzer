package in.goldentriangle.mfa.adapter.out.mfapi;

import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import in.goldentriangle.mfa.application.sync.NavUpstreamSyncGate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BenchmarkNavResolverTest {

    private static final int SCHEME_CODE = 122639;

    private RollingReturnsPort rollingReturnsPort;
    private MfApiSchemeResolver schemeResolver;
    private NavUpstreamSyncGate syncGate;
    private InMemoryCache cache;
    private BenchmarkNavResolver resolver;

    @BeforeEach
    void setUp() {
        rollingReturnsPort = mock(RollingReturnsPort.class);
        schemeResolver = mock(MfApiSchemeResolver.class);
        syncGate = mock(NavUpstreamSyncGate.class);
        cache = new InMemoryCache();
        when(schemeResolver.resolveCode("Test Fund")).thenReturn(SCHEME_CODE);
        when(syncGate.shouldFetchFromUpstream(SCHEME_CODE, UpstreamSyncSource.INVESTT)).thenReturn(true);
        resolver = new BenchmarkNavResolver(rollingReturnsPort, schemeResolver, syncGate, cache);
    }

    @Test
    void doesNotCacheUnavailableBenchmarkSnapshot() {
        when(rollingReturnsPort.fetch(any())).thenThrow(new RuntimeException("upstream down"));

        BenchmarkNavResolver.BenchmarkSnapshot first = resolver.resolve("Test Fund", "01-01-2013");
        BenchmarkNavResolver.BenchmarkSnapshot second = resolver.resolve("Test Fund", "01-01-2013");

        assertEquals(BenchmarkNavResolver.UNAVAILABLE_LABEL, first.benchmarkName());
        assertEquals(BenchmarkNavResolver.UNAVAILABLE_LABEL, second.benchmarkName());
        verify(rollingReturnsPort, times(2)).fetch(any());
        verify(syncGate, times(2)).markFailure(eq(SCHEME_CODE), eq(UpstreamSyncSource.INVESTT), any());
    }

    @Test
    void cachesSuccessfulBenchmarkSnapshot() {
        when(rollingReturnsPort.fetch(any())).thenReturn(successfulData());

        BenchmarkNavResolver.BenchmarkSnapshot first = resolver.resolve("Test Fund", "01-01-2013");
        BenchmarkNavResolver.BenchmarkSnapshot second = resolver.resolve("Test Fund", "01-01-2013");

        assertEquals("Nifty 500 TRI", first.benchmarkName());
        assertTrue(BenchmarkNavResolver.isAvailable(second));
        verify(rollingReturnsPort, times(1)).fetch(any());
        verify(syncGate, times(1)).markSuccess(SCHEME_CODE, UpstreamSyncSource.INVESTT);
    }

    @Test
    void skipsUpstreamWhenDailySyncGateIsClosed() {
        when(syncGate.shouldFetchFromUpstream(SCHEME_CODE, UpstreamSyncSource.INVESTT)).thenReturn(false);

        BenchmarkNavResolver.BenchmarkSnapshot snapshot = resolver.resolve("Test Fund", "01-01-2013");

        assertEquals(BenchmarkNavResolver.UNAVAILABLE_LABEL, snapshot.benchmarkName());
        verify(rollingReturnsPort, times(0)).fetch(any());
    }

    private static RollingReturnsData successfulData() {
        RollingReturnRow row = new RollingReturnRow(
                1,
                "AMC",
                "Index",
                "Nifty 500 TRI",
                "1 Year",
                "01-01-2024",
                100.0,
                "02-01-2024",
                101.0,
                12.0);
        return new RollingReturnsData(List.of(), List.of(row));
    }

    private static final class InMemoryCache implements CachePort {
        private final ConcurrentHashMap<String, Object> store = new ConcurrentHashMap<>();

        @Override
        public <T> Optional<T> get(String key, Class<T> type) {
            return Optional.ofNullable(type.cast(store.get(key)));
        }

        @Override
        public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
            return type.cast(store.computeIfAbsent(key, ignored -> loader.get()));
        }

        @Override
        public void evict(String key) {
            store.remove(key);
        }
    }
}
