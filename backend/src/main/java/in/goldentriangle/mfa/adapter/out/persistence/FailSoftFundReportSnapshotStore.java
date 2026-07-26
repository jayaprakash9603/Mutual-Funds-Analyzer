package in.goldentriangle.mfa.adapter.out.persistence;

import in.goldentriangle.mfa.domain.model.FundReportSnapshot;
import in.goldentriangle.mfa.domain.port.out.FundReportSnapshotPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class FailSoftFundReportSnapshotStore implements FundReportSnapshotPort {

    private static final Logger log = LoggerFactory.getLogger(FailSoftFundReportSnapshotStore.class);

    private final FundReportSnapshotPort delegate;

    public FailSoftFundReportSnapshotStore(List<FundReportSnapshotPort> ports) {
        this.delegate = ports.stream()
                .filter(port -> !(port instanceof FailSoftFundReportSnapshotStore))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No FundReportSnapshotPort delegate configured"));
    }

    @Override
    public Optional<FundReportSnapshot> find(String scheme, String startDate) {
        try {
            return delegate.find(scheme, startDate);
        } catch (Exception ex) {
            log.warn("Fund report snapshot lookup failed for {} / {}: {}", scheme, startDate, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public FundReportSnapshot save(FundReportSnapshot snapshot) {
        try {
            return delegate.save(snapshot);
        } catch (Exception ex) {
            log.warn(
                    "Fund report snapshot save failed for {} / {}: {}",
                    snapshot.scheme(),
                    snapshot.startDate(),
                    ex.getMessage());
            return snapshot;
        }
    }
}
