package in.goldentriangle.mfa.adapter.in.web.dto.report;

public record SwpTimelinePointDto(
        String date,
        double corpus,
        double withdrawn,
        double nav,
        double averageCorpus) {
}
