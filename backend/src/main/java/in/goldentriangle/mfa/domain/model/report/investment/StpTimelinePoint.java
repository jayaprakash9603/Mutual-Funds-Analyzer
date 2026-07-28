package in.goldentriangle.mfa.domain.model.report.investment;

public record StpTimelinePoint(
        String date,
        double sourceCorpus,
        double targetCorpus,
        double transferred,
        double totalValue,
        double targetNav,
        double averageTotal) {
}
