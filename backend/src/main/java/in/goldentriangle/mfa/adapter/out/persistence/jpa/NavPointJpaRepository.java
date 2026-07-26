package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NavPointJpaRepository extends JpaRepository<NavPointEntity, Long> {
    List<NavPointEntity> findBySchemeCodeAndSeriesOrderByNavDateAsc(int schemeCode, String series);
}
