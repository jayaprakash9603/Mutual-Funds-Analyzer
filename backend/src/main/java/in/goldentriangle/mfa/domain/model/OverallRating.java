package in.goldentriangle.mfa.domain.model;

public enum OverallRating {
    PASSED,
    AVERAGE,
    WEAK,
    AVOID;

    public static OverallRating fromPassCount(int passCount) {
        return switch (passCount) {
            case 3 -> PASSED;
            case 2 -> AVERAGE;
            case 1 -> WEAK;
            default -> AVOID;
        };
    }

    public String displayLabel() {
        return switch (this) {
            case PASSED -> "Passed";
            case AVERAGE -> "Average";
            case WEAK -> "Weak";
            case AVOID -> "Avoid";
        };
    }

    public String insightLabel() {
        return switch (this) {
            case PASSED -> "Excellent";
            case AVERAGE -> "Good";
            case WEAK -> "Caution";
            case AVOID -> "Avoid";
        };
    }
}
