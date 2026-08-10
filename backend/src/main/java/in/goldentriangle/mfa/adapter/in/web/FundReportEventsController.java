package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.application.report.ReportRefreshEventHub;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api")
@ConditionalOnFeature(FeatureKeys.ANALYSIS_FUND_REPORT)
public class FundReportEventsController {

    private static final Logger log = LoggerFactory.getLogger(FundReportEventsController.class);

    private final ReportRefreshEventHub eventHub;

    public FundReportEventsController(ReportRefreshEventHub eventHub) {
        this.eventHub = eventHub;
    }

    @GetMapping(path = "/fund-report/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter subscribe(@RequestParam String scheme) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
        log.info("SSE HTTP open /api/fund-report/events scheme='{}'", scheme.trim());
        return eventHub.subscribe(scheme.trim());
    }
}
