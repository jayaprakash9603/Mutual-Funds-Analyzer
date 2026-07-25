package in.goldentriangle.mfa.domain.port.in;

import java.util.List;

public interface SearchSchemesUseCase {
    List<String> search(String query, String category);
}
