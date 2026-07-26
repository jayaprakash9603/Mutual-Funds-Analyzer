package in.goldentriangle.mfa.application.catalog;

import in.goldentriangle.mfa.domain.port.in.SearchSchemesUseCase;
import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchSchemesService implements SearchSchemesUseCase {

    private final SchemeCatalogPort schemeCatalogPort;

    public SearchSchemesService(SchemeCatalogPort schemeCatalogPort) {
        this.schemeCatalogPort = schemeCatalogPort;
    }

    @Override
    public List<String> search(String query, String category) {
        return schemeCatalogPort.search(query, category);
    }
}
