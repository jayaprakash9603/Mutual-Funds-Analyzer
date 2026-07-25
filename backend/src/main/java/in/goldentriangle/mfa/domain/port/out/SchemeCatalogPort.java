package in.goldentriangle.mfa.domain.port.out;

import java.util.List;

public interface SchemeCatalogPort {
    List<String> search(String query, String category);
}
