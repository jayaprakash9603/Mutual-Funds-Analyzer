package in.goldentriangle.mfa.application.report;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ReportRefreshEventHubTest {

    @Test
    void subscribeAndPublishWithoutThrowing() {
        ReportRefreshEventHub hub = new ReportRefreshEventHub();
        SseEmitter emitter = hub.subscribe("Test Fund");
        assertNotNull(emitter);
        assertDoesNotThrow(() -> hub.publishReportReady(
                "Test Fund",
                Instant.parse("2026-08-07T00:00:00Z"),
                Instant.parse("2026-08-10T00:00:00Z")));
        assertDoesNotThrow(hub::heartbeat);
        emitter.complete();
    }
}
