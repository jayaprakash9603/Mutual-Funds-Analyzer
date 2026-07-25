package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.AnalyticsProperties;
import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;
import in.goldentriangle.mfa.domain.port.in.GetPeerComparisonUseCase;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PeerComparisonService implements GetPeerComparisonUseCase {

    private static final int MAX_PEERS = 10;

    private final SchemeCatalogPort schemeCatalogPort;
    private final RollingReturnsPort rollingReturnsPort;
    private final FeatureGuard featureGuard;
    private final UpstreamProperties upstreamProperties;
    private final MetricsCalculator metricsCalculator;

    public PeerComparisonService(
            SchemeCatalogPort schemeCatalogPort,
            RollingReturnsPort rollingReturnsPort,
            FeatureGuard featureGuard,
            AnalyticsProperties analyticsProperties,
            UpstreamProperties upstreamProperties,
            Clock clock) {
        this.schemeCatalogPort = schemeCatalogPort;
        this.rollingReturnsPort = rollingReturnsPort;
        this.featureGuard = featureGuard;
        this.upstreamProperties = upstreamProperties;
        this.metricsCalculator = new MetricsCalculator(
                analyticsProperties.riskFreeRate(), analyticsProperties.tradingDays(), clock);
    }

    @Override
    public PeerComparisonReport compare(String scheme, String category) {
        featureGuard.require(FeatureKeys.ANALYSIS_PEER_COMPARISON);

        List<String> peers = schemeCatalogPort.search("", category).stream()
                .filter(name -> !name.equals(scheme))
                .limit(MAX_PEERS)
                .toList();

        List<PeerComparisonReport.PeerRow> rows = new ArrayList<>();
        for (String peer : peers) {
            try {
                var data = rollingReturnsPort.fetch(new AnalysisQuery(
                        peer, Period.FIVE_YEAR, upstreamProperties.defaultStartDate()));
                FundMetrics metrics = metricsCalculator.compute(
                        new AnalysisInput(data.fund(), data.benchmark(), Period.Labels.FIVE_YEAR));
                rows.add(new PeerComparisonReport.PeerRow(
                        peer,
                        metrics.totalReturn(),
                        metrics.fundSharpe(),
                        metrics.maxDrawdown(),
                        metrics.consistencyScore(),
                        false));
            } catch (RuntimeException ignored) {
                // skip peers that fail to load
            }
        }

        List<String> highlights = buildHighlights(rows);
        return new PeerComparisonReport(rows, highlights);
    }

    private List<String> buildHighlights(List<PeerComparisonReport.PeerRow> rows) {
        if (rows.isEmpty()) {
            return List.of("No peer data available.");
        }
        List<String> highlights = new ArrayList<>();
        rows.stream().max(Comparator.comparingDouble(PeerComparisonReport.PeerRow::return5Y))
                .ifPresent(r -> highlights.add("Highest Return: " + r.scheme()));
        rows.stream().min(Comparator.comparingDouble(PeerComparisonReport.PeerRow::maxDrawdown))
                .ifPresent(r -> highlights.add("Lowest Risk: " + r.scheme()));
        rows.stream().max(Comparator.comparingDouble(PeerComparisonReport.PeerRow::sharpe))
                .ifPresent(r -> highlights.add("Highest Sharpe: " + r.scheme()));
        rows.stream().max(Comparator.comparingDouble(PeerComparisonReport.PeerRow::consistencyScore))
                .ifPresent(r -> highlights.add("Best Consistency: " + r.scheme()));
        return highlights;
    }
}
