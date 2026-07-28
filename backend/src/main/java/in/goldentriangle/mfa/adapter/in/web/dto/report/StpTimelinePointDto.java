package in.goldentriangle.mfa.adapter.in.web.dto.report;

import java.util.List;

public record StpTimelinePointDto(
        String date,
        double sourceCorpus,
        double targetCorpus,
        double transferred,
        double totalValue,
        double targetNav,
        double averageTotal) {
}
