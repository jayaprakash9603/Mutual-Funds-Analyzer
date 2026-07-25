package in.goldentriangle.mfa.domain.model;

import java.util.List;

public record RollingReturnsData(
        List<RollingReturnRow> fund,
        List<RollingReturnRow> benchmark
) {
}
