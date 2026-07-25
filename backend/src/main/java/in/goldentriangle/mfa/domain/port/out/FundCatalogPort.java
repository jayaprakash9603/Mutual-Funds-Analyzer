package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.FundScheme;

import java.util.List;

public interface FundCatalogPort {
    List<FundScheme> search(String query);
}
