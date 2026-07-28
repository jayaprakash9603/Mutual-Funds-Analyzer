package in.goldentriangle.mfa.domain.model.report.investment;

public record SipTimelinePoint(
        String date,
        double invested,
        double corpus,
        double nav,
        double averageCorpus) {
}
