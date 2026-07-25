package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.report.PortfolioSnapshot;

import java.util.Optional;

public interface PortfolioPort {

    Optional<PortfolioSnapshot> fetch(String scheme);
}
