package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.FundScheme;

import java.util.List;

public interface SearchFundsUseCase {
    List<FundScheme> search(String query);
}
