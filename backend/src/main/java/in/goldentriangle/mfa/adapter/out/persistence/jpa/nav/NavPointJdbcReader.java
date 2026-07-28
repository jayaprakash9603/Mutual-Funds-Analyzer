package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.NavSeries;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Component
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class NavPointJdbcReader {

    private final JdbcTemplate jdbcTemplate;
    private final NavPointSqlDialect dialect;

    public NavPointJdbcReader(JdbcTemplate jdbcTemplate, NavPointSqlDialect dialect) {
        this.jdbcTemplate = jdbcTemplate;
        this.dialect = dialect;
    }

    public List<NavPoint> loadFrom(int schemeCode, NavSeries series, LocalDate fromDateInclusive) {
        return jdbcTemplate.query(
                dialect.rangeSelectSql(),
                (rs, rowNum) -> new NavPoint(
                        rs.getDate("nav_date").toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant(),
                        rs.getDouble("nav")),
                schemeCode,
                series.name(),
                fromDateInclusive);
    }

    public List<NavPoint> loadAll(int schemeCode, NavSeries series) {
        return loadFrom(schemeCode, series, LocalDate.of(1900, 1, 1));
    }
}
