package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.port.out.FundReportSectionSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopFundReportSectionSnapshotStore implements FundReportSectionSnapshotPort {

    @Override
    public Optional<FundReportSectionSnapshot> find(
            String scheme, String startDate, ReportSectionGroup sectionGroup) {
        return Optional.empty();
    }

    @Override
    public FundReportSectionSnapshot save(FundReportSectionSnapshot snapshot) {
        return snapshot;
    }
}
