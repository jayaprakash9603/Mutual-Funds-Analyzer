package in.goldentriangle.mfa.adapter.out.upstream;

import com.fasterxml.jackson.core.type.TypeReference;
import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class InvesttSchemeCatalogAdapter implements SchemeCatalogPort {

    private final InvesttMultipartGetClient client;

    public InvesttSchemeCatalogAdapter(InvesttMultipartGetClient client) {
        this.client = client;
    }

    @Override
    public List<String> search(String query, String category) {
        List<String> data = client.get(
                "autoSuggestAllMfSchemes",
                Map.of("category", category, "query", query),
                new TypeReference<>() {});
        return data == null ? List.of() : data;
    }
}
