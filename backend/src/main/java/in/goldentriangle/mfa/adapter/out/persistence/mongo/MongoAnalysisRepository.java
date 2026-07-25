package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.FundAnalysis;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.TimelineEvent;
import in.goldentriangle.mfa.domain.port.out.AnalysisRepositoryPort;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Profile(Profiles.MONGO)
public class MongoAnalysisRepository implements AnalysisRepositoryPort {

    private final AnalysisMongoRepository repository;

    public MongoAnalysisRepository(AnalysisMongoRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<FundAnalysis> findLatest(String scheme, Period period) {
        return repository.findFirstBySchemeAndPeriodOrderByAnalysedAtDesc(scheme, period.label())
                .map(this::toDomain);
    }

    @Override
    public void save(FundAnalysis analysis) {
        AnalysisDocument document = new AnalysisDocument();
        document.setScheme(analysis.scheme());
        document.setPeriod(analysis.period().label());
        document.setAnalysedAt(analysis.analysedAt());
        document.setResult(analysis.result());
        document.setInsights(analysis.insights());
        document.setTimeline(analysis.timeline());
        repository.save(document);
    }

    @Override
    public List<FundAnalysis> findRecent(int limit) {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "analysedAt")).stream()
                .limit(limit)
                .map(this::toDomain)
                .toList();
    }

    private FundAnalysis toDomain(AnalysisDocument document) {
        return new FundAnalysis(
                document.getScheme(),
                Period.fromLabel(document.getPeriod()),
                document.getResult(),
                document.getInsights(),
                document.getTimeline(),
                document.getAnalysedAt());
    }
}
