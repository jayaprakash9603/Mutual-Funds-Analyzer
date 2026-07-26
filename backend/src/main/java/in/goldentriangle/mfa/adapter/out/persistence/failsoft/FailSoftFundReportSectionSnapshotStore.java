package in.goldentriangle.mfa.adapter.out.persistence.failsoft;

import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;
import in.goldentriangle.mfa.domain.port.out.FundReportSectionSnapshotPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class FailSoftFundReportSectionSnapshotStore implements FundReportSectionSnapshotPort {

    private static final Logger log = LoggerFactory.getLogger(FailSoftFundReportSectionSnapshotStore.class);

    private final FundReportSectionSnapshotPort delegate;

    public FailSoftFundReportSectionSnapshotStore(List<FundReportSectionSnapshotPort> ports) {
        this.delegate = ports.stream()
                .filter(port -> !(port instanceof FailSoftFundReportSectionSnapshotStore))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No FundReportSectionSnapshotPort delegate configured"));
    }

    @Override
    public Optional<FundReportSectionSnapshot> find(
            String scheme, String startDate, ReportSectionGroup sectionGroup) {
        try {
            return delegate.find(scheme, startDate, sectionGroup);
        } catch (Exception ex) {
            log.warn(
                    "Fund report section snapshot lookup failed for {} / {} / {}: {}",
                    scheme,
                    startDate,
                    sectionGroup,
                    ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public FundReportSectionSnapshot save(FundReportSectionSnapshot snapshot) {
        try {
            return delegate.save(snapshot);
        } catch (Exception ex) {
            log.warn(
                    "Fund report section snapshot save failed for {} / {} / {}: {}",
                    snapshot.scheme(),
                    snapshot.startDate(),
                    snapshot.sectionGroup(),
                    ex.getMessage());
            return snapshot;
        }
    }
}
