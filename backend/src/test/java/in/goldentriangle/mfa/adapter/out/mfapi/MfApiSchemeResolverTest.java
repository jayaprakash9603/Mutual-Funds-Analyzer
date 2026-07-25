package in.goldentriangle.mfa.adapter.out.mfapi;

import in.goldentriangle.mfa.domain.model.FundScheme;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundCatalogPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MfApiSchemeResolverTest {

    private FundCatalogPort fundCatalogPort;
    private MfApiSchemeResolver resolver;

    @BeforeEach
    void setUp() {
        fundCatalogPort = mock(FundCatalogPort.class);
        CachePort cachePort = new CachePort() {
            @Override
            public <T> Optional<T> get(String key, Class<T> type) {
                return Optional.empty();
            }

            @Override
            public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
                return loader.get();
            }

            @Override
            public void evict(String key) {
            }
        };
        resolver = new MfApiSchemeResolver(fundCatalogPort, cachePort);
    }

    @Test
    void exactNameMatchWinsOverSiblingPlans() {
        when(fundCatalogPort.search("HDFC Flexi Cap Fund - Direct Plan - Growth"))
                .thenReturn(List.of(
                        new FundScheme(118989, "HDFC Flexi Cap Fund - Direct Plan - Growth"),
                        new FundScheme(118990, "HDFC Flexi Cap Fund - Direct Plan - IDCW")));

        int code = resolver.resolveCode("HDFC Flexi Cap Fund - Direct Plan - Growth");

        assertEquals(118989, code);
    }
}
