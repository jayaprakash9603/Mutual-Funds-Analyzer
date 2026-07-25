package in.goldentriangle.mfa.domain.exception;

public class FeatureDisabledException extends DomainException {

    private final String featureKey;

    public FeatureDisabledException(String featureKey) {
        super("Feature disabled: " + featureKey);
        this.featureKey = featureKey;
    }

    public String featureKey() {
        return featureKey;
    }
}
