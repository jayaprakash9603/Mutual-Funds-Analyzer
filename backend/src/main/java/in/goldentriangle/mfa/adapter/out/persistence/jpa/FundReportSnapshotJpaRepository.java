package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FundReportSnapshotJpaRepository extends JpaRepository<FundReportSnapshotEntity, Long> {
    Optional<FundReportSnapshotEntity> findBySchemeAndStartDate(String scheme, String startDate);
}
