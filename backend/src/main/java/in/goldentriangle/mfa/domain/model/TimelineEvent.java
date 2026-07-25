package in.goldentriangle.mfa.domain.model;

public record TimelineEvent(
        String title,
        String date,
        String value,
        String explanation,
        long sortKey
) {
}
