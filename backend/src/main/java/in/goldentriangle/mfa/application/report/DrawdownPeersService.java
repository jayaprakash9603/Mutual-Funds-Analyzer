package in.goldentriangle.mfa.application.report;

import in.goldentriangle.mfa.application.compare.PeerDiscoveryService;
import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.ReportProperties;
import in.goldentriangle.mfa.domain.analytics.report.drawdown.DrawdownCalculator;
import in.goldentriangle.mfa.domain.model.report.drawdown.DrawdownPeersReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.in.GetDrawdownPeersUseCase;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class DrawdownPeersService implements GetDrawdownPeersUseCase {

    private final PeerDiscoveryService peerDiscoveryService;
    private final NavHistoryPort navHistoryPort;
    private final DrawdownCalculator drawdownCalculator;
    private final FeatureGuard featureGuard;
    private final ReportProperties reportProperties;
    private final Executor upstreamExecutor;

    public DrawdownPeersService(
            PeerDiscoveryService peerDiscoveryService,
            NavHistoryPort navHistoryPort,
            DrawdownCalculator drawdownCalculator,
            FeatureGuard featureGuard,
            ReportProperties reportProperties,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor) {
        this.peerDiscoveryService = peerDiscoveryService;
        this.navHistoryPort = navHistoryPort;
        this.drawdownCalculator = drawdownCalculator;
        this.featureGuard = featureGuard;
        this.reportProperties = reportProperties;
        this.upstreamExecutor = upstreamExecutor;
    }

    @Override
    public DrawdownPeersReport compare(String scheme, String category) {
        featureGuard.require(FeatureKeys.ANALYSIS_PEER_COMPARISON);

        List<String> peerNames = peerDiscoveryService.findPeers(scheme, category);
        if (peerNames.isEmpty()) {
            return emptyReport();
        }

        String startDate = reportProperties.earliestStartDate();
        List<CompletableFuture<double[]>> futures = peerNames.stream()
                .map(name -> CompletableFuture.supplyAsync(() -> thresholdPercents(name, startDate), upstreamExecutor))
                .toList();

        List<double[]> peerThresholds = futures.stream()
                .map(CompletableFuture::join)
                .filter(values -> values != null)
                .toList();

        if (peerThresholds.isEmpty()) {
            return emptyReport();
        }

        double[] thresholds = drawdownCalculator.thresholdPercents();
        List<DrawdownPeersReport.DrawdownThresholdRow> rows = new ArrayList<>();
        for (int i = 0; i < thresholds.length; i++) {
            final int index = i;
            double[] values = peerThresholds.stream()
                    .mapToDouble(row -> row[index])
                    .sorted()
                    .toArray();
            rows.add(new DrawdownPeersReport.DrawdownThresholdRow(
                    thresholds[i],
                    median(values)));
        }

        return new DrawdownPeersReport(rows, peerThresholds.size());
    }

    private double[] thresholdPercents(String scheme, String startDate) {
        try {
            NavHistory history = navHistoryPort.fetch(scheme, startDate);
            return drawdownCalculator.thresholdPercentOfDaysForSeries(history.fundNav());
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static double median(double[] values) {
        if (values.length == 0) {
            return 0;
        }
        int mid = values.length / 2;
        if (values.length % 2 == 0) {
            return (values[mid - 1] + values[mid]) / 2;
        }
        return values[mid];
    }

    private static DrawdownPeersReport emptyReport() {
        double[] thresholds = new DrawdownCalculator().thresholdPercents();
        List<DrawdownPeersReport.DrawdownThresholdRow> rows = Arrays.stream(thresholds)
                .mapToObj(t -> new DrawdownPeersReport.DrawdownThresholdRow(t, 0))
                .toList();
        return new DrawdownPeersReport(rows, 0);
    }
}
