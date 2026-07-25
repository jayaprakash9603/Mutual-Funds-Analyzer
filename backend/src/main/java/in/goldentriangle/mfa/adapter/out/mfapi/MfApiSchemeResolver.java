package in.goldentriangle.mfa.adapter.out.mfapi;

import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.FundScheme;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.FundCatalogPort;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Component
public class MfApiSchemeResolver {

    private static final String CACHE_PREFIX = "mfapi-code:";

    private final FundCatalogPort fundCatalogPort;
    private final CachePort cachePort;

    public MfApiSchemeResolver(FundCatalogPort fundCatalogPort, CachePort cachePort) {
        this.fundCatalogPort = fundCatalogPort;
        this.cachePort = cachePort;
    }

    public int resolveCode(String schemeName) {
        String cacheKey = CACHE_PREFIX + schemeName.toLowerCase(Locale.ENGLISH);
        return cachePort.getOrLoad(cacheKey, Integer.class, () -> {
            List<FundScheme> matches = fundCatalogPort.search(schemeName);
            if (matches.isEmpty()) {
                throw new NoDataFoundException("No mfapi scheme found for " + schemeName);
            }
            FundScheme chosen = matches.stream()
                    .filter(scheme -> scheme.schemeName().equalsIgnoreCase(schemeName))
                    .findFirst()
                    .orElseGet(() -> matches.stream()
                            .max(Comparator.comparingInt(s -> scoreMatch(schemeName, s.schemeName())))
                            .orElse(matches.get(0)));
            return chosen.schemeCode();
        });
    }

    private static int scoreMatch(String query, String candidate) {
        String q = query.toLowerCase(Locale.ENGLISH);
        String c = candidate.toLowerCase(Locale.ENGLISH);
        if (c.equals(q)) {
            return 100;
        }
        if (c.contains(q)) {
            return 80;
        }
        return 0;
    }
}
