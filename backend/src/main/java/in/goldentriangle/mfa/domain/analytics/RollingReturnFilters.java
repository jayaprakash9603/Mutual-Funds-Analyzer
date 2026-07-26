package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;

import java.util.List;

public final class RollingReturnFilters {

    private RollingReturnFilters() {
    }

    public static List<RollingReturnRow> byPeriod(List<RollingReturnRow> rows, String periodLabel) {
        return rows.stream().filter(row -> periodLabel.equals(row.period())).toList();
    }
}
