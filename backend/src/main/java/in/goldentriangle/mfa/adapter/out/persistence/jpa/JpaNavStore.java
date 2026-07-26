package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import in.goldentriangle.mfa.adapter.out.persistence.NavStoreMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;
import in.goldentriangle.mfa.domain.port.out.NavStorePort;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
        List<NavPointEntity> entities = points.stream()
                .map(point -> NavStoreMapper.toEntity(schemeCode, series, point))
                .toList();
        pointRepository.saveAll(entities);
    }

    @Override
    @Transactional
    public NavSeriesMeta saveMeta(NavSeriesMeta meta) {
        NavSeriesMetaEntity entity = metaRepository.findBySchemeCode(meta.schemeCode())
                .orElseGet(NavSeriesMetaEntity::new);
        NavStoreMapper.applyMeta(entity, meta);
        if (entity.getId() != null) {
            entity.setVersion(meta.version());
        }
        try {
            return NavStoreMapper.toDomain(metaRepository.save(entity));
        } catch (OptimisticLockingFailureException ex) {
            NavSeriesMetaEntity latest = metaRepository.findBySchemeCode(meta.schemeCode()).orElseThrow(() -> ex);
            NavStoreMapper.applyMeta(latest, meta);
            latest.setVersion(meta.version());
            return NavStoreMapper.toDomain(metaRepository.save(latest));
        }
    }
}
