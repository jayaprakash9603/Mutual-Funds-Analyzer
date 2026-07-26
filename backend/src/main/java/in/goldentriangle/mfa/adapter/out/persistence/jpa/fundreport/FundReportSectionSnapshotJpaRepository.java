package in.goldentriangle.mfa.adapter.out.persistence.jpa.fundreport;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FundReportSectionSnapshotJpaRepository
        extends JpaRepository<FundReportSectionSnapshotEntity, Long> {

    Optional<FundReportSectionSnapshotEntity> findBySchemeAndStartDateAndSectionGroup(
            String scheme, String startDate, String sectionGroup);
}
