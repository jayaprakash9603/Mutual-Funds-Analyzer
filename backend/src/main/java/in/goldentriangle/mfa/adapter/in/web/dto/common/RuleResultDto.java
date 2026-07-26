package in.goldentriangle.mfa.adapter.in.web.dto.common;

public record RuleResultDto(
        String id,
        String label,
        boolean passed,
        double fundValue,
        double benchmarkValue,
        String description
) {
}
