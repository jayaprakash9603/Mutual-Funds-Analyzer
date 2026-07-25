package in.goldentriangle.mfa.domain.model;

import java.util.List;

public record AnalysisInput(
        List<RollingReturnRow> fund,
        List<RollingReturnRow> benchmark,
        String period
) {
}
