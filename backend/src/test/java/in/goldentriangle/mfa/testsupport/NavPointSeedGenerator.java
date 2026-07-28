package in.goldentriangle.mfa.testsupport;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

public final class NavPointSeedGenerator {

    public static final int DEFAULT_SCHEME_COUNT = 20;
    public static final int DEFAULT_POINTS_PER_SERIES = 5_000;

    private NavPointSeedGenerator() {
    }

    public static List<NavPoint> seriesForScheme(int schemeCode, NavSeries series, int pointCount) {
        List<NavPoint> points = new ArrayList<>(pointCount);
        LocalDate date = LocalDate.of(2000, 1, 3);
        double nav = 10.0 + schemeCode * 0.01 + (series == NavSeries.BENCHMARK ? 0.5 : 0.0);
        while (points.size() < pointCount) {
            if (date.getDayOfWeek().getValue() < 6) {
                nav *= 1.0003 + (points.size() % 17) * 0.00001;
                points.add(new NavPoint(date.atStartOfDay(ZoneOffset.UTC).toInstant(), nav));
            }
            date = date.plusDays(1);
        }
        return points;
    }

    public static int totalRows(int schemeCount, int pointsPerSeries) {
        return schemeCount * 2 * pointsPerSeries;
    }
}
