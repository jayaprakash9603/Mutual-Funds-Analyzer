package in.goldentriangle.mfa.adapter.in.web.support;

import in.goldentriangle.mfa.adapter.in.web.dto.section.ReportSectionEnvelopeDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

public final class ReportSectionResponses {

    private ReportSectionResponses() {
    }

    public static <T> ResponseEntity<ReportSectionEnvelopeDto<T>> ok(
            ReportSectionEnvelopeDto<T> envelope,
            String ifNoneMatch) {
        String etag = ReportSectionEtag.compute(envelope);
        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(304)
                    .eTag(etag)
                    .build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, etag)
                .body(envelope);
    }
}
