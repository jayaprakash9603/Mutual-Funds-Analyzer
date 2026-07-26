package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.FundReportSnapshotMapper;
import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.FundReportSnapshot;
import in.goldentriangle.mfa.domain.port.out.FundReportSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile({Profiles.MYSQL, Profiles.H2, Profiles.POSTGRES, Profiles.JPA})
public class JpaFundReportSnapshotStore implements FundReportSnapshotPort {

    private final FundReportSnapshotJpaRepository repository;
    private final ObjectMapper objectMapper;

    public JpaFundReportSnapshotStore(FundReportSnapshotJpaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<FundReportSnapshot> find(String scheme, String startDate) {
        return repository.findBySchemeAndStartDate(scheme, startDate)
                .map(entity -> FundReportSnapshotMapper.toDomain(entity, objectMapper));
    }

    @Override
    public FundReportSnapshot save(FundReportSnapshot snapshot) {
        FundReportSnapshotEntity entity = repository.findBySchemeAndStartDate(snapshot.scheme(), snapshot.startDate())
                .orElseGet(FundReportSnapshotEntity::new);
        apply(entity, snapshot);
        try {
            return FundReportSnapshotMapper.toDomain(repository.save(entity), objectMapper);
        } catch (OptimisticLockingFailureException ex) {
            FundReportSnapshotEntity latest = repository.findBySchemeAndStartDate(snapshot.scheme(), snapshot.startDate())
                    .orElseThrow(() -> ex);
            apply(latest, snapshot);
            return FundReportSnapshotMapper.toDomain(repository.save(latest), objectMapper);
        }
    }

    private void apply(FundReportSnapshotEntity entity, FundReportSnapshot snapshot) {
        FundReportSnapshotMapper.apply(entity, snapshot, objectMapper);
        if (entity.getId() != null) {
            entity.setVersion(snapshot.version());
        }
    }
}
