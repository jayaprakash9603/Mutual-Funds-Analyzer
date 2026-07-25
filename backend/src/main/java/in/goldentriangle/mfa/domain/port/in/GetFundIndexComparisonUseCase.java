package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.FundIndexComparison;

public interface GetFundIndexComparisonUseCase {
    FundIndexComparison get(String scheme, String startDate);
}
