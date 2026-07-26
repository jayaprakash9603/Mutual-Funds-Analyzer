package in.goldentriangle.mfa.adapter.out.persistence.jpa.analysis;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.domain.model.FundAnalysis;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.TimelineEvent;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.port.out.AnalysisRepositoryPort;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaAnalysisRepository implements AnalysisRepositoryPort {

    private final AnalysisJpaRepository repository;
    private final ObjectMapper objectMapper;

    public JpaAnalysisRepository(AnalysisJpaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<FundAnalysis> findLatest(String scheme, Period period) {
        return repository.findFirstBySchemeAndPeriodOrderByAnalysedAtDesc(scheme, period.label())
                .map(this::toDomain);
    }

    @Override
    public void save(FundAnalysis analysis) {
        AnalysisEntity entity = new AnalysisEntity();
        entity.setScheme(analysis.scheme());
        entity.setPeriod(analysis.period().label());
        entity.setAnalysedAt(analysis.analysedAt());
        entity.setResultJson(writeJson(analysis.result()));
        entity.setInsightsJson(writeJson(analysis.insights()));
        entity.setTimelineJson(writeJson(analysis.timeline()));
        repository.save(entity);
    }

    @Override
    public List<FundAnalysis> findRecent(int limit) {
        return repository.findAllByOrderByAnalysedAtDesc(PageRequest.of(0, limit)).stream()
                .map(this::toDomain)
                .toList();
    }

    private FundAnalysis toDomain(AnalysisEntity entity) {
        return new FundAnalysis(
                entity.getScheme(),
                Period.fromLabel(entity.getPeriod()),
                readJson(entity.getResultJson(), GoldenTriangleResult.class),
                readJson(entity.getInsightsJson(), new TypeReference<>() {}),
                readJson(entity.getTimelineJson(), new TypeReference<>() {}),
                entity.getAnalysedAt());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize analysis", ex);
        }
    }

    private <T> T readJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize analysis", ex);
        }
    }

    private <T> T readJson(String json, TypeReference<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize analysis", ex);
        }
    }
}
