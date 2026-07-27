package in.goldentriangle.mfa.application.compare;

import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import in.goldentriangle.mfa.domain.analytics.report.returns.TrailingReturnsCalculator;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;
import in.goldentriangle.mfa.domain.port.in.GetPeerComparisonUseCase;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Service
public class PeerComparisonService implements GetPeerComparisonUseCase {

    private static final int MAX_PEERS = 10;
    private static final List<String> LONG_RUN_HORIZONS = List.of(
            "1 Year", "3 Year", "5 Year", "10 Year", "15 Year", "20 Year");

    private final RollingReturnsPort rollingReturnsPort;
    private final NavHistoryPort navHistoryPort;
    private final PeerDiscoveryService peerDiscoveryService;
    private final FeatureGuard featureGuard;
    private final UpstreamProperties upstreamProperties;
    private final MetricsCalculator metricsCalculator;
    private final TrailingReturnsCalculator trailingReturnsCalculator;
    private final Executor upstreamExecutor;

    public PeerComparisonService(
            RollingReturnsPort rollingReturnsPort,
            NavHistoryPort navHistoryPort,
            PeerDiscoveryService peerDiscoveryService,
            FeatureGuard featureGuard,
            AnalyticsProperties analyticsProperties,
            UpstreamProperties upstreamProperties,
            Clock clock,
            TrailingReturnsCalculator trailingReturnsCalculator,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.navHistoryPort = navHistoryPort;
        this.peerDiscoveryService = peerDiscoveryService;
        this.featureGuard = featureGuard;
        this.upstreamProperties = upstreamProperties;
        this.trailingReturnsCalculator = trailingReturnsCalculator;
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
        PeerComparisonReport.LongRunAnalysis longRunAnalysis = buildLongRunAnalysis(rows, category);
        return new PeerComparisonReport(rows, highlights, Period.Labels.FIVE_YEAR, longRunAnalysis);
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
                    selected,
                    buildHorizonReturns(schemeName));
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private List<PeerComparisonReport.HorizonReturn> buildHorizonReturns(String schemeName) {
        try {
            NavHistory history = navHistoryPort.fetch(schemeName, upstreamProperties.defaultStartDate());
            TrailingReturnsReport trailing = trailingReturnsCalculator.compute(history);
            Map<String, TrailingReturnsReport.PeriodReturn> byLabel = trailing.periods().stream()
                    .collect(Collectors.toMap(
                            TrailingReturnsReport.PeriodReturn::label,
                            period -> period,
                            (left, right) -> left));

            List<PeerComparisonReport.HorizonReturn> horizons = new ArrayList<>(LONG_RUN_HORIZONS.size());
            for (String label : LONG_RUN_HORIZONS) {
                TrailingReturnsReport.PeriodReturn period = byLabel.get(label);
                if (period == null) {
                    horizons.add(new PeerComparisonReport.HorizonReturn(label, null, null));
                } else {
                    horizons.add(new PeerComparisonReport.HorizonReturn(
                            label, period.cagr(), period.moneyMultiplied()));
                }
            }
            return horizons;
        } catch (RuntimeException ignored) {
            return LONG_RUN_HORIZONS.stream()
                    .map(label -> new PeerComparisonReport.HorizonReturn(label, null, null))
                    .toList();
        }
    }

    private PeerComparisonReport.LongRunAnalysis buildLongRunAnalysis(
            List<PeerComparisonReport.PeerRow> rows,
            String category) {
        String categoryLabel = category == null || category.isBlank() || "All".equals(category)
                ? "Category peers"
                : category;

        Instant asOf = rows.stream()
                .filter(PeerComparisonReport.PeerRow::selected)
                .findFirst()
                .flatMap(row -> latestNavDate(row.scheme()))
                .orElseGet(() -> rows.stream()
                        .findFirst()
                        .flatMap(row -> latestNavDate(row.scheme()))
                        .orElse(null));

        String asOfDate = asOf == null
                ? ""
                : DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH)
                        .withZone(ZoneOffset.UTC)
                        .format(asOf);

        List<Double> twentyYearCagrs = new ArrayList<>();
        List<Double> twentyYearMultiples = new ArrayList<>();
        for (PeerComparisonReport.PeerRow row : rows) {
            row.horizonReturns().stream()
                    .filter(horizon -> "20 Year".equals(horizon.label()))
                    .findFirst()
                    .ifPresent(horizon -> {
                        if (horizon.cagrPercent() != null) {
                            twentyYearCagrs.add(horizon.cagrPercent());
                        }
                        if (horizon.moneyMultiplied() != null) {
                            twentyYearMultiples.add(horizon.moneyMultiplied());
                        }
                    });
        }

        return new PeerComparisonReport.LongRunAnalysis(
                categoryLabel,
                asOfDate,
                LONG_RUN_HORIZONS,
                minOrNull(twentyYearCagrs),
                maxOrNull(twentyYearCagrs),
                minOrNull(twentyYearMultiples),
                maxOrNull(twentyYearMultiples));
    }

    private java.util.Optional<Instant> latestNavDate(String schemeName) {
        try {
            NavHistory history = navHistoryPort.fetch(schemeName, upstreamProperties.defaultStartDate());
            return history.fundNav().isEmpty()
                    ? java.util.Optional.empty()
                    : java.util.Optional.of(history.lastNavDate());
        } catch (RuntimeException ignored) {
            return java.util.Optional.empty();
        }
    }

    private static Double minOrNull(List<Double> values) {
        return values.isEmpty()
                ? null
                : values.stream().min(Double::compareTo).orElse(null);
    }

    private static Double maxOrNull(List<Double> values) {
        return values.isEmpty()
                ? null
                : values.stream().max(Double::compareTo).orElse(null);
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
