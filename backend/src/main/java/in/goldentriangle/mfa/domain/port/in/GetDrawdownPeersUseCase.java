package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownPeersReport;

public interface GetDrawdownPeersUseCase {

    DrawdownPeersReport compare(String scheme, String category);
}
