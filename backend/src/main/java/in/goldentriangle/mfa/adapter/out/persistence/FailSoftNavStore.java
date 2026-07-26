package in.goldentriangle.mfa.adapter.out.persistence;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;
import in.goldentriangle.mfa.domain.port.out.NavStorePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class FailSoftNavStore implements NavStorePort {

    private static final Logger log = LoggerFactory.getLogger(FailSoftNavStore.class);

    private final NavStorePort delegate;

    public FailSoftNavStore(List<NavStorePort> ports) {
        this.delegate = ports.stream()
                .filter(port -> !(port instanceof FailSoftNavStore))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No NavStorePort delegate configured"));
    }

    @Override
    public Optional<NavSeriesMeta> findMeta(int schemeCode) {
        try {
            return delegate.findMeta(schemeCode);
        } catch (Exception ex) {
            log.warn("NAV meta lookup failed for scheme code {}: {}", schemeCode, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public List<NavPoint> loadPoints(int schemeCode, NavSeries series) {
        try {
            return delegate.loadPoints(schemeCode, series);
        } catch (Exception ex) {
            log.warn("NAV point load failed for {} / {}: {}", schemeCode, series, ex.getMessage());
            return List.of();
        }
    }

    @Override
    public void append(int schemeCode, NavSeries series, List<NavPoint> points) {
        try {
            delegate.append(schemeCode, series, points);
        } catch (Exception ex) {
            log.warn("NAV append failed for {} / {}: {}", schemeCode, series, ex.getMessage());
        }
    }

    @Override
    public NavSeriesMeta saveMeta(NavSeriesMeta meta) {
        try {
            return delegate.saveMeta(meta);
        } catch (Exception ex) {
            log.warn("NAV meta save failed for {}: {}", meta.schemeCode(), ex.getMessage());
            return meta;
        }
    }
}
