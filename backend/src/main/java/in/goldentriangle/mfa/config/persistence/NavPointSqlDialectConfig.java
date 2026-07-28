package in.goldentriangle.mfa.config.persistence;

import in.goldentriangle.mfa.adapter.out.persistence.jpa.nav.NavPointSqlDialect;
import in.goldentriangle.mfa.config.Profiles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class NavPointSqlDialectConfig {

    @Bean
    @Profile(Profiles.MYSQL)
    NavPointSqlDialect navPointSqlDialect() {
        return mysqlDialect();
    }

    @Bean
    @Profile(Profiles.POSTGRES)
    NavPointSqlDialect postgresNavPointSqlDialect() {
        return postgresDialect();
    }

    @Bean
    @Profile({Profiles.H2, Profiles.JPA})
    NavPointSqlDialect h2NavPointSqlDialect() {
        return h2Dialect();
    }

    private static NavPointSqlDialect mysqlDialect() {
        return new NavPointSqlDialect(
                """
                        INSERT INTO nav_point (scheme_code, series, nav_date, nav)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE nav = VALUES(nav)
                        """,
                """
                        SELECT nav_date, nav
                        FROM nav_point
                        WHERE scheme_code = ? AND series = ? AND nav_date >= ?
                        ORDER BY nav_date ASC
                        """);
    }

    private static NavPointSqlDialect postgresDialect() {
        return new NavPointSqlDialect(
                """
                        INSERT INTO nav_point (scheme_code, series, nav_date, nav)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT (scheme_code, series, nav_date)
                        DO UPDATE SET nav = EXCLUDED.nav
                        """,
                """
                        SELECT nav_date, nav
                        FROM nav_point
                        WHERE scheme_code = ? AND series = ? AND nav_date >= ?
                        ORDER BY nav_date ASC
                        """);
    }

    private static NavPointSqlDialect h2Dialect() {
        return new NavPointSqlDialect(
                """
                        MERGE INTO nav_point (scheme_code, series, nav_date, nav)
                        KEY (scheme_code, series, nav_date)
                        VALUES (?, ?, ?, ?)
                        """,
                """
                        SELECT nav_date, nav
                        FROM nav_point
                        WHERE scheme_code = ? AND series = ? AND nav_date >= ?
                        ORDER BY nav_date ASC
                        """);
    }
}
