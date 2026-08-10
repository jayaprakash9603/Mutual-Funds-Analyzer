package in.goldentriangle.mfa.application.report;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory SSE fan-out for report-ready notifications (single-instance deploy).
 */
@Component
public class ReportRefreshEventHub {

    private static final Logger log = LoggerFactory.getLogger(ReportRefreshEventHub.class);

    /** 30 minutes — clients reconnect; heartbeat keeps the link warm. */
    private static final long EMITTER_TIMEOUT_MS = 30L * 60L * 1000L;

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emittersByScheme = new ConcurrentHashMap<>();
    private final AtomicInteger totalSubscribers = new AtomicInteger();

    public SseEmitter subscribe(String scheme) {
        String key = normalize(scheme);
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> emitters =
                emittersByScheme.computeIfAbsent(key, ignored -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);
        int total = totalSubscribers.incrementAndGet();

        Runnable cleanup = () -> {
            boolean removed = emitters.remove(emitter);
            if (removed) {
                int remaining = totalSubscribers.decrementAndGet();
                log.info(
                        "SSE disconnected scheme='{}' schemeListeners={} totalListeners={}",
                        scheme,
                        emitters.size(),
                        remaining);
            }
            if (emitters.isEmpty()) {
                emittersByScheme.remove(key, emitters);
            }
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(() -> {
            log.info("SSE timeout scheme='{}'", scheme);
            cleanup.run();
        });
        emitter.onError(ex -> {
            log.info(
                    "SSE error scheme='{}' reason={}",
                    scheme,
                    ex == null ? "unknown" : ex.getClass().getSimpleName() + ": " + ex.getMessage());
            cleanup.run();
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("type", "connected", "scheme", scheme)));
            log.info(
                    "SSE subscribed scheme='{}' schemeListeners={} totalListeners={}",
                    scheme,
                    emitters.size(),
                    total);
        } catch (IOException ex) {
            log.warn("SSE failed to send connected event scheme='{}': {}", scheme, ex.getMessage());
            cleanup.run();
            emitter.completeWithError(ex);
        }
        return emitter;
    }

    public void publishReportReady(String scheme, Instant watermarkNavDate, Instant computedAt) {
        String key = normalize(scheme);
        List<SseEmitter> emitters = emittersByScheme.get(key);
        if (emitters == null || emitters.isEmpty()) {
            log.info(
                    "SSE report-ready skipped (no listeners) scheme='{}' watermark={} computedAt={}",
                    scheme,
                    watermarkNavDate,
                    computedAt);
            return;
        }
        Map<String, Object> payload = Map.of(
                "type", "report-ready",
                "scheme", scheme,
                "watermarkNavDate", watermarkNavDate == null ? "" : watermarkNavDate.toString(),
                "computedAt", computedAt == null ? "" : computedAt.toString());
        int delivered = 0;
        int failed = 0;
        for (SseEmitter emitter : List.copyOf(emitters)) {
            try {
                emitter.send(SseEmitter.event().name("report-ready").data(payload));
                delivered++;
            } catch (IOException | IllegalStateException ex) {
                failed++;
                log.info(
                        "SSE report-ready delivery failed scheme='{}' reason={}",
                        scheme,
                        ex.getClass().getSimpleName() + ": " + ex.getMessage());
                emitters.remove(emitter);
                totalSubscribers.updateAndGet(n -> Math.max(0, n - 1));
                try {
                    emitter.complete();
                } catch (Exception ignored) {
                    // already closed
                }
            }
        }
        if (emitters.isEmpty()) {
            emittersByScheme.remove(key, emitters);
        }
        log.info(
                "SSE report-ready published scheme='{}' watermark={} computedAt={} delivered={} failed={} remainingListeners={}",
                scheme,
                watermarkNavDate,
                computedAt,
                delivered,
                failed,
                emitters.size());
    }

    public void heartbeat() {
        int live = 0;
        int dropped = 0;
        for (Map.Entry<String, CopyOnWriteArrayList<SseEmitter>> entry : emittersByScheme.entrySet()) {
            for (SseEmitter emitter : List.copyOf(entry.getValue())) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                    live++;
                } catch (IOException | IllegalStateException ex) {
                    dropped++;
                    entry.getValue().remove(emitter);
                    totalSubscribers.updateAndGet(n -> Math.max(0, n - 1));
                    try {
                        emitter.complete();
                    } catch (Exception ignored) {
                        // already closed
                    }
                }
            }
            if (entry.getValue().isEmpty()) {
                emittersByScheme.remove(entry.getKey(), entry.getValue());
            }
        }
        if (live > 0 || dropped > 0) {
            log.debug("SSE heartbeat live={} dropped={} totalListeners={}", live, dropped, totalSubscribers.get());
        }
    }

    private static String normalize(String scheme) {
        return scheme == null ? "" : scheme.trim().toLowerCase();
    }
}
