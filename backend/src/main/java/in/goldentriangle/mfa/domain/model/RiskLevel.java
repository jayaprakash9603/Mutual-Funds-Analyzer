package in.goldentriangle.mfa.domain.model;

import java.util.Arrays;

/** Annualised volatility bands, ordered from the tightest upper bound to the widest. */
public enum RiskLevel {
    VERY_LOW("Very Low", 8),
    LOW("Low", 12),
    MEDIUM("Medium", 18),
    HIGH("High", 25),
    VERY_HIGH("Very High", Double.POSITIVE_INFINITY);

    private final String label;
    private final double maxVolatilityPercent;

    RiskLevel(String label, double maxVolatilityPercent) {
        this.label = label;
        this.maxVolatilityPercent = maxVolatilityPercent;
    }

    public String label() {
        return label;
    }

    public static RiskLevel forVolatility(double volatilityPercent) {
        return Arrays.stream(values())
                .filter(level -> volatilityPercent <= level.maxVolatilityPercent)
                .findFirst()
                .orElse(VERY_HIGH);
    }
}
