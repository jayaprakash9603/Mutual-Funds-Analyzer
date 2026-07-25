package in.goldentriangle.mfa.domain.model;

public record RuleResult(
        RuleId id,
        String label,
        boolean passed,
        double fundValue,
        double benchmarkValue,
        String description
) {
    public String idValue() {
        return switch (id) {
            case ROLLING_RETURN -> "rollingReturn";
            case COB -> "cob";
            case SHARPE -> "sharpe";
        };
    }
}
