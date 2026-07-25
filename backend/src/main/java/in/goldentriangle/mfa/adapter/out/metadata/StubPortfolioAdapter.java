package in.goldentriangle.mfa.adapter.out.metadata;

import in.goldentriangle.mfa.domain.model.report.PortfolioSnapshot;
import in.goldentriangle.mfa.domain.port.out.PortfolioPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class StubPortfolioAdapter implements PortfolioPort {

    @Override
    public Optional<PortfolioSnapshot> fetch(String scheme) {
        return Optional.empty();
    }
}
