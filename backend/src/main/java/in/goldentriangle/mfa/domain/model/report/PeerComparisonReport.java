package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record PeerComparisonReport(
        List<PeerRow> peers,
        List<String> highlights) {

    public record PeerRow(
            String scheme,
            double return5Y,
            double sharpe,
            double maxDrawdown,
            double consistencyScore,
            boolean metadataAvailable) {
    }
}
