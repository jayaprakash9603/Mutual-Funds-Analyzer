package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record PeerComparisonDto(List<PeerRowDto> peers, List<String> highlights) {

    public record PeerRowDto(
            String scheme,
            double return5Y,
            double sharpe,
            double maxDrawdown,
            double consistencyScore,
            boolean metadataAvailable) {
    }
}
