package in.goldentriangle.mfa.application.sync;

import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.properties.SyncProperties;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.port.out.NavUpstreamSyncPort;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class NavUpstreamSyncGate {

    private final NavUpstreamSyncPort syncPort;
    private final SyncProperties syncProperties;
    private final FeatureFlags featureFlags;
    private final Clock clock;
    private final ZoneId syncZone;

    public NavUpstreamSyncGate(
            NavUpstreamSyncPort syncPort,
            SyncProperties syncProperties,
            FeatureFlags featureFlags,
            Clock clock) {
        this.syncPort = syncPort;
        this.syncProperties = syncProperties;
        this.featureFlags = featureFlags;
        this.clock = clock;
        this.syncZone = ZoneId.of(syncProperties.zoneId());
    }

    public boolean isEnabled() {
        return syncProperties.enabled() && featureFlags.getPlatform().getPersistence().isEnabled();
    }

    public LocalDate syncDate() {
        return clock.instant().atZone(syncZone).toLocalDate();
    }

    public boolean shouldFetchFromUpstream(int schemeCode, UpstreamSyncSource source) {
        if (!isEnabled()) {
            return true;
        }
        LocalDate today = syncDate();
        if (syncPort.isSuccessfulToday(schemeCode, source, today)) {
            return false;
        }
        return !syncPort.hasExhaustedAttempts(schemeCode, source, today, syncProperties.maxAttemptsPerDay());
    }

    public boolean upstreamCheckDue(int schemeCode, UpstreamSyncSource source, boolean legacyDue) {
        if (!isEnabled()) {
            return legacyDue;
        }
        LocalDate today = syncDate();
        if (syncPort.isSuccessfulToday(schemeCode, source, today)) {
            return false;
        }
        if (syncPort.hasExhaustedAttempts(schemeCode, source, today, syncProperties.maxAttemptsPerDay())) {
            return false;
        }
        return legacyDue;
    }

    public void beginAttempt(int schemeCode, UpstreamSyncSource source) {
        if (!isEnabled()) {
            return;
        }
        syncPort.beginAttempt(schemeCode, source, syncDate());
    }

    public void markSuccess(int schemeCode, UpstreamSyncSource source) {
        if (!isEnabled()) {
            return;
        }
        syncPort.markSuccess(schemeCode, source, syncDate());
    }

    public void markFailure(int schemeCode, UpstreamSyncSource source, String errorMessage) {
        if (!isEnabled()) {
            return;
        }
        syncPort.markFailure(schemeCode, source, syncDate(), errorMessage);
    }
}
