package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import in.goldentriangle.mfa.adapter.out.persistence.mapper.NavStoreMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.config.concurrency.OptimisticLockRetry;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;
import in.goldentriangle.mfa.domain.port.out.NavStorePort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaNavStore implements NavStorePort {

    private final NavPointJpaRepository pointRepository;
    private final NavSeriesMetaJpaRepository metaRepository;

    public JpaNavStore(NavPointJpaRepository pointRepository, NavSeriesMetaJpaRepository metaRepository) {
        this.pointRepository = pointRepository;
        this.metaRepository = metaRepository;
    }

    @Override
    public Optional<NavSeriesMeta> findMeta(int schemeCode) {
        return metaRepository.findBySchemeCode(schemeCode).map(NavStoreMapper::toDomain);
    }

    @Override
    public List<NavPoint> loadPoints(int schemeCode, NavSeries series) {
        return pointRepository.findBySchemeCodeAndSeriesOrderByNavDateAsc(schemeCode, series.name()).stream()
                .map(NavStoreMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public void append(int schemeCode, NavSeries series, List<NavPoint> points) {
        if (points.isEmpty()) {
            return;
        }

        Set<LocalDate> candidateDates = points.stream()
                .map(point -> point.date().atZone(ZoneOffset.UTC).toLocalDate())
                .collect(Collectors.toSet());
        Set<LocalDate> existingDates = pointRepository.findExistingNavDates(
                schemeCode, series.name(), candidateDates);

        List<NavPointEntity> entities = points.stream()
                .filter(point -> !existingDates.contains(point.date().atZone(ZoneOffset.UTC).toLocalDate()))
                .map(point -> NavStoreMapper.toEntity(schemeCode, series, point))
                .toList();
        if (entities.isEmpty()) {
            return;
        }
        pointRepository.saveAll(entities);
    }

    @Override
    @Transactional
    public NavSeriesMeta saveMeta(NavSeriesMeta meta) {
        return OptimisticLockRetry.run(() -> {
            NavSeriesMetaEntity entity = metaRepository.findBySchemeCode(meta.schemeCode())
                    .orElseGet(NavSeriesMetaEntity::new);
            NavStoreMapper.applyMeta(entity, meta);
            return NavStoreMapper.toDomain(metaRepository.save(entity));
        });
    }
}
