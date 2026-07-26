package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.FundReportSnapshot;

import java.util.Optional;

public interface FundReportSnapshotPort {
    Optional<FundReportSnapshot> find(String scheme, String startDate);

    FundReportSnapshot save(FundReportSnapshot snapshot);
}
