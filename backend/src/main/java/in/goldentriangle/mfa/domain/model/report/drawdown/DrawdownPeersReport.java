package in.goldentriangle.mfa.domain.model.report.drawdown;

import java.util.List;

public record DrawdownPeersReport(
        List<DrawdownThresholdRow> thresholdRows,
        int peerCount) {

    public record DrawdownThresholdRow(
            double thresholdPercent,
            double peerMedianPercentOfDays) {
    }
}
