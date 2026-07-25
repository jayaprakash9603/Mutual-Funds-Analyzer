package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.report.FundMetadata;

import java.util.Optional;

public interface FundMetadataPort {

    Optional<FundMetadata> fetch(String scheme);
}
