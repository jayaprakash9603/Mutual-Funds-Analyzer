package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.report.ReturnBand;

public final class ReturnBandClassifier {

    private static final double STRONG_THRESHOLD = 10;
    private static final double MODERATE_THRESHOLD = 7;

    private ReturnBandClassifier() {
    }

    public static ReturnBand classify(double annualisedReturnPercent) {
        if (annualisedReturnPercent >= STRONG_THRESHOLD) {
            return ReturnBand.STRONG;
        }
        if (annualisedReturnPercent >= MODERATE_THRESHOLD) {
            return ReturnBand.MODERATE;
        }
        if (annualisedReturnPercent >= 0) {
            return ReturnBand.WEAK;
        }
        return ReturnBand.NEGATIVE;
    }
}
