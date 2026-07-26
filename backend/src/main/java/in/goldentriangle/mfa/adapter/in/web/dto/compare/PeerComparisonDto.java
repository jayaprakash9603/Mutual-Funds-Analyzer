package in.goldentriangle.mfa.adapter.in.web.dto.compare;

import java.util.List;

public record PeerComparisonDto(
        List<PeerRowDto> peers,
        List<String> highlights,
        String periodLabel) {

    public record PeerRowDto(
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
