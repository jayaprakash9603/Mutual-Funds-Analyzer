package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.AnalyticsProperties;
import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.UpstreamProperties;
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
import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.regex.Pattern;

@Service
public class PeerComparisonService implements GetPeerComparisonUseCase {

    private static final int MAX_PEERS = 10;
    private static final String ALL_CATEGORIES = "All";
    /** The catalog only recognises its own labels, so SEBI-style category names are reduced to keywords. */
    private static final Pattern CATEGORY_NOISE = Pattern.compile("(?i)\\b(fund|funds|scheme|schemes|other)\\b");
    private static final Pattern PAYOUT_PLAN = Pattern.compile("(?i)\\b(idcw|dividend|payout|bonus)\\b");

    private final SchemeCatalogPort schemeCatalogPort;
    private final RollingReturnsPort rollingReturnsPort;
    private final FeatureGuard featureGuard;
    private final UpstreamProperties upstreamProperties;
    private final MetricsCalculator metricsCalculator;
    private final Executor matrixExecutor;

    public PeerComparisonService(
            SchemeCatalogPort schemeCatalogPort,
            RollingReturnsPort rollingReturnsPort,
            FeatureGuard featureGuard,
            AnalyticsProperties analyticsProperties,
            UpstreamProperties upstreamProperties,
            Clock clock,
            @Qualifier("matrixExecutor") Executor matrixExecutor) {
        this.schemeCatalogPort = schemeCatalogPort;
        this.rollingReturnsPort = rollingReturnsPort;
        this.featureGuard = featureGuard;
        this.upstreamProperties = upstreamProperties;
        this.metricsCalculator = new MetricsCalculator(
                analyticsProperties.riskFreeRate(), analyticsProperties.tradingDays(), clock);
        this.matrixExecutor = matrixExecutor;
    }

    @Override
    public PeerComparisonReport compare(String scheme, String category) {
        featureGuard.require(FeatureKeys.ANALYSIS_PEER_COMPARISON);

        List<String> peerNames = findPeers(scheme, category);

        List<String> schemes = new ArrayList<>(peerNames.size() + 1);
        schemes.add(scheme);
        schemes.addAll(peerNames);

        List<CompletableFuture<PeerComparisonReport.PeerRow>> futures = schemes.stream()
                .map(name -> CompletableFuture.supplyAsync(
                        () -> buildRow(name, name.equals(scheme)),
                        matrixExecutor))
                .toList();

        List<PeerComparisonReport.PeerRow> rows = futures.stream()
                .map(CompletableFuture::join)
                .filter(row -> row != null)
                .sorted(Comparator.comparingDouble(PeerComparisonReport.PeerRow::average).reversed())
                .toList();

        List<String> highlights = buildHighlights(rows);
        return new PeerComparisonReport(rows, highlights, Period.Labels.FIVE_YEAR);
    }

    /**
     * The report carries SEBI category names from mfapi, which the investt catalog cannot filter on,
     * so peers are discovered by searching the category keywords instead.
     */
    private List<String> findPeers(String scheme, String category) {
        String keywords = categoryKeywords(category);
        List<String> candidates = searchQuietly(keywords);
        if (candidates.isEmpty()) {
            candidates = searchQuietly(lastTwoWords(keywords));
        }

        List<String> direct = new ArrayList<>();
        List<String> regular = new ArrayList<>();
        for (String name : candidates) {
            if (name.equalsIgnoreCase(scheme) || PAYOUT_PLAN.matcher(name).find()) {
                continue;
            }
            if (name.toLowerCase(Locale.ROOT).contains("direct")) {
                direct.add(name);
            } else {
                regular.add(name);
            }
        }

        List<String> peers = new ArrayList<>(direct);
        peers.addAll(regular);
        return peers.stream().limit(MAX_PEERS - 1L).toList();
    }

    private List<String> searchQuietly(String query) {
        if (query.isBlank()) {
            return List.of();
        }
        try {
            return schemeCatalogPort.search(query, ALL_CATEGORIES);
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    static String categoryKeywords(String category) {
        if (category == null || category.isBlank() || ALL_CATEGORIES.equalsIgnoreCase(category)) {
            return "";
        }
        String tail = category.substring(category.lastIndexOf('-') + 1);
        String cleaned = CATEGORY_NOISE.matcher(tail).replaceAll(" ").replaceAll("\\s+", " ").trim();
        return cleaned.isEmpty() ? category.trim() : cleaned;
    }

    private static String lastTwoWords(String value) {
        String[] words = value.split("\\s+");
        if (words.length <= 2) {
            return value;
        }
        return words[words.length - 2] + " " + words[words.length - 1];
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
