package in.goldentriangle.mfa.adapter.out.persistence.jpa.fundreport;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.FundReportSectionSnapshotMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.config.concurrency.OptimisticLockRetry;
import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.port.out.FundReportSectionSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaFundReportSectionSnapshotStore implements FundReportSectionSnapshotPort {

    private final FundReportSectionSnapshotJpaRepository repository;
    private final ObjectMapper objectMapper;

    public JpaFundReportSectionSnapshotStore(
            FundReportSectionSnapshotJpaRepository repository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<FundReportSectionSnapshot> find(
            String scheme, String startDate, ReportSectionGroup sectionGroup) {
        return repository.findBySchemeAndStartDateAndSectionGroup(scheme, startDate, sectionGroup.name())
                .map(entity -> FundReportSectionSnapshotMapper.toDomain(entity, objectMapper));
    }

    @Override
    public FundReportSectionSnapshot save(FundReportSectionSnapshot snapshot) {
        return OptimisticLockRetry.run(() -> {
            FundReportSectionSnapshotEntity entity = repository
                    .findBySchemeAndStartDateAndSectionGroup(
                            snapshot.scheme(), snapshot.startDate(), snapshot.sectionGroup().name())
                    .orElseGet(FundReportSectionSnapshotEntity::new);
            FundReportSectionSnapshotMapper.apply(entity, snapshot, objectMapper);
            return FundReportSectionSnapshotMapper.toDomain(repository.save(entity), objectMapper);
        });
    }
}
