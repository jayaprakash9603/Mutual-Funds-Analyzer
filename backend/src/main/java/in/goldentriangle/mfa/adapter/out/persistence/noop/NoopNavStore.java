package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;
import in.goldentriangle.mfa.domain.port.out.NavStorePort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopNavStore implements NavStorePort {

    @Override
    public Optional<NavSeriesMeta> findMeta(int schemeCode) {
        return Optional.empty();
    }

    @Override
    public List<NavPoint> loadPoints(int schemeCode, NavSeries series) {
        return List.of();
    }

    @Override
    public List<NavPoint> loadPoints(int schemeCode, NavSeries series, Instant fromDateInclusive) {
        return List.of();
    }

    @Override
    public void append(int schemeCode, NavSeries series, List<NavPoint> points) {
    }

    @Override
    public NavSeriesMeta saveMeta(NavSeriesMeta meta) {
        return meta;
    }
}
