package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;

public interface GetPeerComparisonUseCase {

    PeerComparisonReport compare(String scheme, String category);
}
