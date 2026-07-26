package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record DrawdownPeersDto(
        List<DrawdownThresholdRowDto> thresholdRows,
        int peerCount) {

    public record DrawdownThresholdRowDto(
            double thresholdPercent,
            double peerMedianPercentOfDays) {
    }
}
