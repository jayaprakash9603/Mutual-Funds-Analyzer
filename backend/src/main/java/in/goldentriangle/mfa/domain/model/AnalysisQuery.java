package in.goldentriangle.mfa.domain.model;

import java.util.List;

public record AnalysisQuery(
        String scheme,
        Period period,
        String startDate
) {
}
