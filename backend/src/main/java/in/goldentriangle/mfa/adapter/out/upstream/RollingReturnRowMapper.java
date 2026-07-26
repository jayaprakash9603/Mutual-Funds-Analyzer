package in.goldentriangle.mfa.adapter.out.upstream;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RollingReturnRowMapper {

    public RollingReturnRow toDomain(Map<String, Object> row, String period) {
        return new RollingReturnRow(
                toLong(row.get("id")),
                toString(row.get("scheme_company")),
                toString(row.getOrDefault("scheme_category", "")),
                toString(row.get("scheme_name")),
                row.containsKey("period") ? toString(row.get("period")) : period,
                toString(row.get("nav_date")),
                toDouble(row.get("scheme_nav")),
                toString(row.get("scheme_forward_date")),
                toDouble(row.get("scheme_forward_nav")),
                toDouble(row.get("scheme_rolling_returns")));
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0;
    }

    private String toString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
