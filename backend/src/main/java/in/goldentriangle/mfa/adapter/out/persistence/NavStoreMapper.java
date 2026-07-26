package in.goldentriangle.mfa.adapter.out.persistence;

import in.goldentriangle.mfa.adapter.out.persistence.jpa.NavPointEntity;
import in.goldentriangle.mfa.adapter.out.persistence.jpa.NavSeriesMetaEntity;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import in.goldentriangle.mfa.domain.model.NavSeriesMeta;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

public final class NavStoreMapper {

    private NavStoreMapper() {
    }

    public static NavSeriesMeta toDomain(NavSeriesMetaEntity entity) {
        return new NavSeriesMeta(
                entity.getSchemeCode(),
                entity.getScheme(),
                entity.getFundName(),
                entity.getBenchmarkName(),
                entity.getCategory(),
                entity.getAmc(),
                entity.getFirstNavDate(),
                entity.getWatermarkNavDate(),
                entity.getBenchmarkWatermarkNavDate(),
                entity.getRefreshedAt(),
                entity.getVersion());
    }

    public static void applyMeta(NavSeriesMetaEntity entity, NavSeriesMeta meta) {
        entity.setSchemeCode(meta.schemeCode());
        entity.setScheme(meta.scheme());
        entity.setFundName(meta.fundName());
        entity.setBenchmarkName(meta.benchmarkName());
        entity.setCategory(meta.category());
        entity.setAmc(meta.amc());
        entity.setFirstNavDate(meta.firstNavDate());
        entity.setWatermarkNavDate(meta.watermarkNavDate());
        entity.setBenchmarkWatermarkNavDate(meta.benchmarkWatermarkNavDate());
        entity.setRefreshedAt(meta.refreshedAt());
    }

    public static NavPointEntity toEntity(int schemeCode, NavSeries series, NavPoint point) {
        NavPointEntity entity = new NavPointEntity();
        entity.setSchemeCode(schemeCode);
        entity.setSeries(series.name());
        entity.setNavDate(point.date().atZone(ZoneOffset.UTC).toLocalDate());
        entity.setNav(point.nav());
        return entity;
    }

    public static NavPoint toDomain(NavPointEntity entity) {
        Instant date = entity.getNavDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        return new NavPoint(date, entity.getNav());
    }

    public static Instant parseStartDate(String startDate) {
        if (startDate == null || startDate.isBlank()) {
            return LocalDate.of(1995, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant();
        }
        return in.goldentriangle.mfa.adapter.out.mfapi.MfApiNavMapper.parseDate(startDate)
                .orElse(LocalDate.of(1995, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant());
    }

    public static List<NavPoint> filterFromStart(List<NavPoint> points, String startDateUsed) {
        Instant cutoff = parseStartDate(startDateUsed);
        return points.stream()
                .filter(p -> !p.date().isBefore(cutoff))
                .toList();
    }

    public static Instant maxDate(List<NavPoint> points) {
        return points.stream()
                .map(NavPoint::date)
                .max(Instant::compareTo)
                .orElse(null);
    }

    public static Instant minDate(List<NavPoint> points) {
        return points.stream()
                .map(NavPoint::date)
                .min(Instant::compareTo)
                .orElse(null);
    }
}
