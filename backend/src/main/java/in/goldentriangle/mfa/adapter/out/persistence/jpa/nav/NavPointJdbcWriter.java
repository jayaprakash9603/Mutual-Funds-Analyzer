package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Component
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class NavPointJdbcWriter {

    private final JdbcTemplate jdbcTemplate;
    private final String upsertSql;

    public NavPointJdbcWriter(JdbcTemplate jdbcTemplate, NavPointSqlDialect dialect) {
        this.jdbcTemplate = jdbcTemplate;
        this.upsertSql = dialect.upsertSql();
    }

    public void batchUpsert(int schemeCode, NavSeries series, List<NavPoint> points) {
        if (points.isEmpty()) {
            return;
        }
        jdbcTemplate.batchUpdate(
                upsertSql,
                points,
                Math.min(points.size(), 500),
                (ps, point) -> {
                    ps.setInt(1, schemeCode);
                    ps.setString(2, series.name());
                    ps.setObject(3, LocalDate.ofInstant(point.date(), ZoneOffset.UTC));
                    ps.setDouble(4, point.nav());
                });
    }
}
