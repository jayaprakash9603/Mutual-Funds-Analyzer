package in.goldentriangle.mfa.adapter.out.mfapi;

import com.fasterxml.jackson.core.type.TypeReference;
import in.goldentriangle.mfa.domain.model.FundScheme;
import in.goldentriangle.mfa.domain.port.out.FundCatalogPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class MfApiFundCatalogAdapter implements FundCatalogPort {

    private final MfApiClient client;

    public MfApiFundCatalogAdapter(MfApiClient client) {
        this.client = client;
    }

    @Override
    public List<FundScheme> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        List<Map<String, Object>> results = client.get(
                "/mf/search",
                Map.of("q", query),
                new TypeReference<>() {});
        if (results == null) {
            return List.of();
        }
        return results.stream()
                .map(row -> new FundScheme(
                        intValue(row.get("schemeCode")),
                        string(row.get("schemeName"))))
                .filter(scheme -> scheme.schemeCode() > 0 && !scheme.schemeName().isBlank())
                .toList();
    }

    private static String string(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static int intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(string(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
