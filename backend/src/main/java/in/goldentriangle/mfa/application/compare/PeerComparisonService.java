package in.goldentriangle.mfa.application.compare;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;
import in.goldentriangle.mfa.domain.port.in.GetPeerComparisonUseCase;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class PeerComparisonService implements GetPeerComparisonUseCase {

    private static final int MAX_PEERS = 10;

    private final RollingReturnsPort rollingReturnsPort;
    private final PeerDiscoveryService peerDiscoveryService;
    private final FeatureGuard featureGuard;
    private final UpstreamProperties upstreamProperties;
    private final MetricsCalculator metricsCalculator;
    private final Executor upstreamExecutor;

    public PeerComparisonService(
            RollingReturnsPort rollingReturnsPort,
            PeerDiscoveryService peerDiscoveryService,
            FeatureGuard featureGuard,
            AnalyticsProperties analyticsProperties,
            UpstreamProperties upstreamProperties,
            Clock clock,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.peerDiscoveryService = peerDiscoveryService;
        this.featureGuard = featureGuard;
        this.upstreamProperties = upstreamProperties;
        this.metricsCalculator = new MetricsCalculator(
                analyticsProperties.riskFreeRate(), analyticsProperties.tradingDays(), clock);
        this.upstreamExecutor = upstreamExecutor;
    }

    @Override
    public PeerComparisonReport compare(String scheme, String category) {
        featureGuard.require(FeatureKeys.ANALYSIS_PEER_COMPARISON);

        List<String> peerNames = peerDiscoveryService.findPeers(scheme, category);

        List<String> schemes = new ArrayList<>(peerNames.size() + 1);
        schemes.add(scheme);
        schemes.addAll(peerNames);

        List<CompletableFuture<PeerComparisonReport.PeerRow>> futures = schemes.stream()
                .map(name -> CompletableFuture.supplyAsync(
                        () -> buildRow(name, name.equals(scheme)),
                        upstreamExecutor))
                .toList();

        List<PeerComparisonReport.PeerRow> rows = futures.stream()
                .map(CompletableFuture::join)
                .filter(row -> row != null)
                .sorted(Comparator.comparingDouble(PeerComparisonReport.PeerRow::average).reversed())
                .toList();

        List<String> highlights = buildHighlights(rows);
        return new PeerComparisonReport(rows, highlights, Period.Labels.FIVE_YEAR);
    }

    private PeerComparisonReport.PeerRow buildRow(String schemeName, boolean selected) {
        try {
            RollingReturnsData data = rollingReturnsPort.fetch(new AnalysisQuery(
                    schemeName, Period.FIVE_YEAR, upstreamProperties.defaultStartDate()));
            List<Double> returns = data.fund().stream()
                    .map(RollingReturnRow::schemeRollingReturns)
                    .toList();
            if (returns.isEmpty()) {
                return null;
            }

            FundMetrics metrics = metricsCalculator.compute(new AnalysisInput(
                    data.fund(), data.benchmark(), Period.Labels.FIVE_YEAR));
            DoubleSummaryStatistics summary = returns.stream().mapToDouble(Double::doubleValue).summaryStatistics();

            return new PeerComparisonReport.PeerRow(
                    schemeName,
                    summary.getAverage(),
                    summary.getMax(),
                    summary.getMin(),
                    Statistics.stdDev(returns),
                    metrics.cob(),
                    returns.size(),
                    metrics.fundSharpe(),
                    metrics.maxDrawdown(),
                    metrics.consistencyScore(),
                    selected);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private List<String> buildHighlights(List<PeerComparisonReport.PeerRow> rows) {
        if (rows.isEmpty()) {
            return List.of("No peer data available.");
        }
        List<String> highlights = new ArrayList<>();
        rows.stream().max(Comparator.comparingDouble(PeerComparisonReport.PeerRow::average))
                .ifPresent(r -> highlights.add("Highest avg rolling return: " + shortName(r.scheme())));
        rows.stream().max(Comparator.comparingDouble(PeerComparisonReport.PeerRow::cob))
                .ifPresent(r -> highlights.add("Highest COB: " + shortName(r.scheme())));
        rows.stream().max(Comparator.comparingDouble(PeerComparisonReport.PeerRow::sharpe))
                .ifPresent(r -> highlights.add("Highest Sharpe: " + shortName(r.scheme())));
        rows.stream().min(Comparator.comparingDouble(PeerComparisonReport.PeerRow::maxDrawdown))
                .ifPresent(r -> highlights.add("Lowest max drawdown: " + shortName(r.scheme())));
        return highlights;
    }

    private static String shortName(String scheme) {
        if (scheme.length() <= 48) {
            return scheme;
        }
        return scheme.substring(0, 45) + "…";
    }
}
