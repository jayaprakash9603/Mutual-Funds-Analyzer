package in.goldentriangle.mfa.adapter.out.persistence.noop;

import in.goldentriangle.mfa.config.Profiles;
import in.goldentriangle.mfa.domain.model.FundReportSnapshot;
import in.goldentriangle.mfa.domain.port.out.FundReportSnapshotPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Profile(Profiles.NO_PERSISTENCE_EXPRESSION)
public class NoopFundReportSnapshotStore implements FundReportSnapshotPort {

    @Override
    public Optional<FundReportSnapshot> find(String scheme, String startDate) {
        return Optional.empty();
    }

    @Override
    public FundReportSnapshot save(FundReportSnapshot snapshot) {
        return snapshot;
    }
}
