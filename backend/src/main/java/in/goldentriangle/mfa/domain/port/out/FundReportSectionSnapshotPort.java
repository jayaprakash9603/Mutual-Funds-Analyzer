package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;

import java.util.Optional;

public interface FundReportSectionSnapshotPort {

    Optional<FundReportSectionSnapshot> find(String scheme, String startDate, ReportSectionGroup sectionGroup);

    FundReportSectionSnapshot save(FundReportSectionSnapshot snapshot);
}
