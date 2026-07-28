package in.goldentriangle.mfa.application.sync;

import in.goldentriangle.mfa.config.feature.FeatureFlags;
import in.goldentriangle.mfa.config.properties.SyncProperties;
import in.goldentriangle.mfa.domain.model.NavUpstreamSyncAttempt;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.model.UpstreamSyncStatus;
import in.goldentriangle.mfa.domain.port.out.NavUpstreamSyncPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NavUpstreamSyncGateTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 7, 28);
    private static final int SCHEME_CODE = 122639;

    private NavUpstreamSyncPort syncPort;
    private FeatureFlags featureFlags;
    private NavUpstreamSyncGate gate;

    @BeforeEach
    void setUp() {
        syncPort = mock(NavUpstreamSyncPort.class);
        featureFlags = new FeatureFlags();
        featureFlags.getPlatform().getPersistence().setEnabled(true);
        SyncProperties properties = new SyncProperties(true, "0 30 7 * * *", 3, "Asia/Kolkata");
        Clock clock = Clock.fixed(
                TODAY.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant(),
                ZoneId.of("Asia/Kolkata"));
        gate = new NavUpstreamSyncGate(syncPort, properties, featureFlags, clock);
    }

    @Test
    void shouldFetchWhenNoAttemptRecordedToday() {
        when(syncPort.isSuccessfulToday(SCHEME_CODE, UpstreamSyncSource.MFAPI, TODAY)).thenReturn(false);
        when(syncPort.hasExhaustedAttempts(SCHEME_CODE, UpstreamSyncSource.MFAPI, TODAY, 3)).thenReturn(false);

        assertTrue(gate.shouldFetchFromUpstream(SCHEME_CODE, UpstreamSyncSource.MFAPI));
    }

    @Test
    void shouldNotFetchAfterSuccessfulSyncToday() {
        when(syncPort.isSuccessfulToday(SCHEME_CODE, UpstreamSyncSource.MFAPI, TODAY)).thenReturn(true);

        assertFalse(gate.shouldFetchFromUpstream(SCHEME_CODE, UpstreamSyncSource.MFAPI));
        assertFalse(gate.upstreamCheckDue(SCHEME_CODE, UpstreamSyncSource.MFAPI, true));
    }

    @Test
    void shouldNotFetchAfterExhaustingDailyAttempts() {
        when(syncPort.isSuccessfulToday(SCHEME_CODE, UpstreamSyncSource.MFAPI, TODAY)).thenReturn(false);
        when(syncPort.hasExhaustedAttempts(SCHEME_CODE, UpstreamSyncSource.MFAPI, TODAY, 3)).thenReturn(true);

        assertFalse(gate.shouldFetchFromUpstream(SCHEME_CODE, UpstreamSyncSource.MFAPI));
        assertFalse(gate.upstreamCheckDue(SCHEME_CODE, UpstreamSyncSource.MFAPI, true));
    }

    @Test
    void upstreamCheckDueHonoursLegacySignalUntilAttemptsExhausted() {
        when(syncPort.isSuccessfulToday(SCHEME_CODE, UpstreamSyncSource.MFAPI, TODAY)).thenReturn(false);
        when(syncPort.hasExhaustedAttempts(SCHEME_CODE, UpstreamSyncSource.MFAPI, TODAY, 3)).thenReturn(false);

        assertTrue(gate.upstreamCheckDue(SCHEME_CODE, UpstreamSyncSource.MFAPI, true));
        assertFalse(gate.upstreamCheckDue(SCHEME_CODE, UpstreamSyncSource.MFAPI, false));
    }

    @Test
    void disabledWhenPersistenceIsOff() {
        featureFlags.getPlatform().getPersistence().setEnabled(false);

        assertFalse(gate.isEnabled());
        assertTrue(gate.shouldFetchFromUpstream(SCHEME_CODE, UpstreamSyncSource.MFAPI));
        verify(syncPort, never()).isSuccessfulToday(anyInt(), any(), any());
    }

    @Test
    void recordsAttemptLifecycleWhenEnabled() {
        when(syncPort.find(SCHEME_CODE, UpstreamSyncSource.INVESTT, TODAY))
                .thenReturn(Optional.of(new NavUpstreamSyncAttempt(
                        SCHEME_CODE,
                        UpstreamSyncSource.INVESTT,
                        TODAY,
                        1,
                        Instant.EPOCH,
                        UpstreamSyncStatus.PENDING,
                        null)));

        gate.beginAttempt(SCHEME_CODE, UpstreamSyncSource.INVESTT);
        gate.markSuccess(SCHEME_CODE, UpstreamSyncSource.INVESTT);
        gate.markFailure(SCHEME_CODE, UpstreamSyncSource.INVESTT, "timeout");

        verify(syncPort).beginAttempt(SCHEME_CODE, UpstreamSyncSource.INVESTT, TODAY);
        verify(syncPort).markSuccess(SCHEME_CODE, UpstreamSyncSource.INVESTT, TODAY);
        verify(syncPort).markFailure(eq(SCHEME_CODE), eq(UpstreamSyncSource.INVESTT), eq(TODAY), eq("timeout"));
    }
}
