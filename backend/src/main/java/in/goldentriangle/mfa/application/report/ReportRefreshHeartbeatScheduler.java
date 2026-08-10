package in.goldentriangle.mfa.application.report;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReportRefreshHeartbeatScheduler {

    private final ReportRefreshEventHub eventHub;

    public ReportRefreshHeartbeatScheduler(ReportRefreshEventHub eventHub) {
        this.eventHub = eventHub;
    }

    @Scheduled(fixedRateString = "15000")
    public void heartbeat() {
        eventHub.heartbeat();
    }
}
