package in.goldentriangle.mfa.application.sync;

import in.goldentriangle.mfa.adapter.out.persistence.jpa.nav.NavSeriesMetaEntity;
import in.goldentriangle.mfa.adapter.out.persistence.jpa.nav.NavSeriesMetaJpaRepository;
import in.goldentriangle.mfa.config.properties.ReportProperties;
import in.goldentriangle.mfa.domain.model.UpstreamSyncSource;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@ConditionalOnProperty(prefix = "features.sync", name = "enabled", havingValue = "true")
public class DailyUpstreamSyncService {

    private static final Logger log = LoggerFactory.getLogger(DailyUpstreamSyncService.class);

    private final NavUpstreamSyncGate syncGate;
    private final NavHistoryPort navHistoryPort;
    private final NavSeriesMetaJpaRepository metaRepository;
    private final ReportProperties reportProperties;

    public DailyUpstreamSyncService(
            NavUpstreamSyncGate syncGate,
            NavHistoryPort navHistoryPort,
            NavSeriesMetaJpaRepository metaRepository,
            ReportProperties reportProperties) {
        this.syncGate = syncGate;
        this.navHistoryPort = navHistoryPort;
        this.metaRepository = metaRepository;
        this.reportProperties = reportProperties;
    }

    @Scheduled(cron = "${features.sync.daily-cron:0 30 7 * * *}", zone = "${features.sync.zone-id:Asia/Kolkata}")
    public void syncTrackedFundsDaily() {
        if (!syncGate.isEnabled()) {
            return;
        }
        List<NavSeriesMetaEntity> tracked = metaRepository.findAll();
        log.info("Daily upstream sync starting for {} tracked funds", tracked.size());
        for (NavSeriesMetaEntity meta : tracked) {
            syncFund(meta);
        }
        log.info("Daily upstream sync finished");
    }

    public void syncFund(NavSeriesMetaEntity meta) {
        if (!syncGate.shouldFetchFromUpstream(meta.getSchemeCode(), UpstreamSyncSource.MFAPI)) {
            return;
        }
        try {
            navHistoryPort.fetch(meta.getScheme(), reportProperties.earliestStartDate());
        } catch (RuntimeException ex) {
            log.warn("Daily sync failed for {}: {}", meta.getScheme(), ex.getMessage());
        }
    }
}
