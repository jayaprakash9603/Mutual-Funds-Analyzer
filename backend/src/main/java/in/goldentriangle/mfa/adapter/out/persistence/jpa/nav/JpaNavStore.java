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

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaNavStore implements NavStorePort {

    private final NavPointJdbcReader pointReader;
    private final NavPointJdbcWriter pointWriter;
    private final NavSeriesMetaJpaRepository metaRepository;

    public JpaNavStore(
            NavPointJdbcReader pointReader,
            NavPointJdbcWriter pointWriter,
            NavSeriesMetaJpaRepository metaRepository) {
        this.pointReader = pointReader;
        this.pointWriter = pointWriter;
        this.metaRepository = metaRepository;
    }

    @Override
    public Optional<NavSeriesMeta> findMeta(int schemeCode) {
        return metaRepository.findBySchemeCode(schemeCode).map(NavStoreMapper::toDomain);
    }

    @Override
    public List<NavPoint> loadPoints(int schemeCode, NavSeries series) {
        return pointReader.loadAll(schemeCode, series);
    }

    @Override
    public List<NavPoint> loadPoints(int schemeCode, NavSeries series, Instant fromDateInclusive) {
        LocalDate from = fromDateInclusive == null
                ? LocalDate.of(1900, 1, 1)
                : fromDateInclusive.atZone(ZoneOffset.UTC).toLocalDate();
        return pointReader.loadFrom(schemeCode, series, from);
    }

    @Override
    @Transactional
    public void append(int schemeCode, NavSeries series, List<NavPoint> points) {
        pointWriter.batchUpsert(schemeCode, series, points);
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
