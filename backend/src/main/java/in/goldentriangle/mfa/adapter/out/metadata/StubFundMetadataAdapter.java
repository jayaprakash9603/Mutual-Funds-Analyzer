package in.goldentriangle.mfa.adapter.out.metadata;

import in.goldentriangle.mfa.domain.model.report.FundMetadata;
import in.goldentriangle.mfa.domain.port.out.FundMetadataPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class StubFundMetadataAdapter implements FundMetadataPort {

    @Override
    public Optional<FundMetadata> fetch(String scheme) {
        return Optional.empty();
    }
}
