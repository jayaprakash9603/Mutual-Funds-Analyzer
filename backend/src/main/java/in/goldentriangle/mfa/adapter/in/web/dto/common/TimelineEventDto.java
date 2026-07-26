package in.goldentriangle.mfa.adapter.in.web.dto.common;

public record TimelineEventDto(
        String title,
        String date,
        String value,
        String explanation,
        long sortKey
) {
}
