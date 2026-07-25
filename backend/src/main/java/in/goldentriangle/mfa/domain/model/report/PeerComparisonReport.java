package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record PeerComparisonReport(
        List<PeerRow> peers,
        List<String> highlights,
        String periodLabel) {

    public record PeerRow(
            String scheme,
            double average,
            double maximum,
            double minimum,
            double stdDev,
            double cob,
            int totalRecords,
            double sharpe,
            double maxDrawdown,
            double consistencyScore,
            boolean selected) {
    }
}
