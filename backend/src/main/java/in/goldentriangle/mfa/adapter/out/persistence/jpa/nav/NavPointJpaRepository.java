package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface NavPointJpaRepository extends JpaRepository<NavPointEntity, Long> {
    List<NavPointEntity> findBySchemeCodeAndSeriesOrderByNavDateAsc(int schemeCode, String series);

    @Query("""
            select p.navDate from NavPointEntity p
            where p.schemeCode = :schemeCode and p.series = :series and p.navDate in :navDates
            """)
    Set<LocalDate> findExistingNavDates(
            @Param("schemeCode") int schemeCode,
            @Param("series") String series,
            @Param("navDates") Collection<LocalDate> navDates);
}
