package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.AlignedRollingPoint;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class NavSeriesBuilder {

    private static final double MILLIS_PER_DAY = 1000.0 * 60 * 60 * 24;

    /**
     * NAV points more than a week apart are treated as a data gap rather than a holding period, so
     * the implied return between them is discarded.
     */
    private static final double MAX_GAP_DAYS = 7;

    private NavSeriesBuilder() {
    }

    public static List<NavPoint> buildNavSeries(List<RollingReturnRow> rows) {
        Map<String, Double> navMap = new HashMap<>();
        for (RollingReturnRow row : rows) {
            NavDateParser.parse(row.navDate())
                    .ifPresent(date -> navMap.put(NavDateParser.dateKey(date), row.schemeNav()));
            NavDateParser.parse(row.schemeForwardDate())
                    .ifPresent(date -> navMap.put(NavDateParser.dateKey(date), row.schemeForwardNav()));
        }
        return navMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new NavPoint(
                        Instant.parse(entry.getKey() + "T00:00:00Z"),
                        entry.getValue()))
                .toList();
    }

    public static List<CommonNavPoint> getCommonNavSeries(List<NavPoint> fundNav, List<NavPoint> benchmarkNav) {
        Map<String, Double> benchmarkMap = new HashMap<>();
        for (NavPoint point : benchmarkNav) {
            benchmarkMap.put(NavDateParser.dateKey(point.date()), point.nav());
        }
        List<CommonNavPoint> common = new ArrayList<>();
        for (NavPoint point : fundNav) {
            Double bench = benchmarkMap.get(NavDateParser.dateKey(point.date()));
            if (bench != null) {
                common.add(new CommonNavPoint(point.date(), point.nav(), bench));
            }
        }
        common.sort(Comparator.comparing(CommonNavPoint::date));
        return common;
    }

    public static List<Double> computeDailyReturns(List<NavPoint> series) {
        List<Double> returns = new ArrayList<>();
        for (int i = 1; i < series.size(); i++) {
            NavPoint prev = series.get(i - 1);
            NavPoint curr = series.get(i);
            double days = (curr.date().toEpochMilli() - prev.date().toEpochMilli()) / MILLIS_PER_DAY;
            if (days > 0 && days <= MAX_GAP_DAYS) {
                returns.add(curr.nav() / prev.nav() - 1);
            }
        }
        return returns;
    }

    public static List<AlignedRollingPoint> alignRollingReturns(
            List<RollingReturnRow> fund,
            List<RollingReturnRow> benchmark) {
        Map<String, Double> benchmarkMap = new HashMap<>();
        for (RollingReturnRow row : benchmark) {
            NavDateParser.parse(row.navDate())
                    .ifPresent(date -> benchmarkMap.put(
                            NavDateParser.dateKey(date),
                            row.schemeRollingReturns()));
        }
        List<AlignedRollingPoint> aligned = new ArrayList<>();
        for (RollingReturnRow row : fund) {
            Optional<Instant> date = NavDateParser.parse(row.navDate());
            if (date.isEmpty()) {
                continue;
            }
            Double benchmarkReturn = benchmarkMap.get(NavDateParser.dateKey(date.get()));
            if (benchmarkReturn != null) {
                aligned.add(new AlignedRollingPoint(
                        date.get(),
                        row.schemeRollingReturns(),
                        benchmarkReturn));
            }
        }
        return aligned;
    }

    public record CommonNavPoint(Instant date, double fundNav, double benchmarkNav) {
    }
}
