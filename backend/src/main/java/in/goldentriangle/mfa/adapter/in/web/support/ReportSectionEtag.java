package in.goldentriangle.mfa.adapter.in.web.support;

import in.goldentriangle.mfa.adapter.in.web.dto.section.ReportSectionEnvelopeDto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

public final class ReportSectionEtag {

    private ReportSectionEtag() {
    }

    public static String compute(ReportSectionEnvelopeDto<?> envelope) {
        Instant watermark = envelope.watermarkNavDate() == null ? Instant.EPOCH : envelope.watermarkNavDate();
        Instant computedAt = envelope.computedAt() == null ? Instant.EPOCH : envelope.computedAt();
        String payload = envelope.freshness()
                + '|' + watermark.toEpochMilli()
                + '|' + computedAt.toEpochMilli()
                + '|' + envelope.schemaVersion();
        return '"' + sha256(payload) + '"';
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
