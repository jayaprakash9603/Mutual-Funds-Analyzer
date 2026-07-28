package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.NavPoint;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class NavSeriesOrder {

    private NavSeriesOrder() {
    }

    public static boolean isSortedUnique(List<NavPoint> series) {
        if (series == null || series.size() <= 1) {
            return true;
        }
        for (int i = 1; i < series.size(); i++) {
            NavPoint previous = series.get(i - 1);
            NavPoint current = series.get(i);
            int compare = previous.date().compareTo(current.date());
            if (compare >= 0) {
                return false;
            }
        }
        return true;
    }

    public static List<NavPoint> dedupeAndSort(List<NavPoint> nav) {
        if (nav == null || nav.isEmpty()) {
            return List.of();
        }
        if (isSortedUnique(nav)) {
            return nav;
        }
        Map<String, NavPoint> byDate = new HashMap<>();
        for (NavPoint point : nav) {
            byDate.put(NavDateParser.dateKey(point.date()), point);
        }
        return byDate.values().stream()
                .sorted(Comparator.comparing(NavPoint::date))
                .toList();
    }
}
