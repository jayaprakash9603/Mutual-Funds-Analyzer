package in.goldentriangle.mfa.adapter.in.web.dto;

public record TimelineEventDto(
        String title,
        String date,
        String value,
        String explanation,
        long sortKey
) {
}
