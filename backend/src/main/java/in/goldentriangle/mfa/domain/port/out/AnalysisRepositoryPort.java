package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.FundAnalysis;
import in.goldentriangle.mfa.domain.model.Period;

import java.util.List;
import java.util.Optional;

public interface AnalysisRepositoryPort {
    Optional<FundAnalysis> findLatest(String scheme, Period period);

    void save(FundAnalysis analysis);

    List<FundAnalysis> findRecent(int limit);
}
