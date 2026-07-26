package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;

import java.util.List;
import java.util.Optional;

public interface NavStorePort {
    Optional<NavSeriesMeta> findMeta(int schemeCode);

    List<NavPoint> loadPoints(int schemeCode, NavSeries series);

    void append(int schemeCode, NavSeries series, List<NavPoint> points);

    NavSeriesMeta saveMeta(NavSeriesMeta meta);
}
