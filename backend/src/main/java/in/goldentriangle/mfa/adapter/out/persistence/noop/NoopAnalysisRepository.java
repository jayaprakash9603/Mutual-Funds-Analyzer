package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.FundAnalysis;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.port.out.AnalysisRepositoryPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopAnalysisRepository implements AnalysisRepositoryPort {

    @Override
    public Optional<FundAnalysis> findLatest(String scheme, Period period) {
        return Optional.empty();
    }

    @Override
    public void save(FundAnalysis analysis) {
    }

    @Override
    public List<FundAnalysis> findRecent(int limit) {
        return List.of();
    }
}
