package in.goldentriangle.mfa.application.catalog;

import in.goldentriangle.mfa.domain.model.FundScheme;
import in.goldentriangle.mfa.domain.port.in.SearchFundsUseCase;
import in.goldentriangle.mfa.domain.port.out.FundCatalogPort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchFundsService implements SearchFundsUseCase {

    private final FundCatalogPort fundCatalogPort;

    public SearchFundsService(FundCatalogPort fundCatalogPort) {
        this.fundCatalogPort = fundCatalogPort;
    }

    @Override
    public List<FundScheme> search(String query) {
        return fundCatalogPort.search(query);
    }
}
