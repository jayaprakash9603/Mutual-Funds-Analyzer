package in.goldentriangle.mfa.application.compare;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.mapper.PeerSnapshotMapper;
import in.goldentriangle.mfa.application.platform.FeatureGuard;
import in.goldentriangle.mfa.config.concurrency.SingleFlightCoordinator;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.AnalyticsProperties;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.analytics.MetricsCalculator;
import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.analytics.Statistics;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.PeerComparisonSnapshot;
import in.goldentriangle.mfa.domain.model.PeerFundSnapshot;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;
import in.goldentriangle.mfa.domain.port.in.GetPeerComparisonUseCase;
import in.goldentriangle.mfa.domain.port.out.PeerComparisonSnapshotPort;
import in.goldentriangle.mfa.domain.port.out.PeerFundSnapshotPort;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;

@Service
public class PeerComparisonService implements GetPeerComparisonUseCase {

    /** Bumped when peer rows switched to investt rolling returns only (no mfapi NAV). */
    public static final int PEER_SCHEMA_VERSION = 2;

    private static final List<String> LONG_RUN_HORIZONS = List.of(
            "1 Year", "3 Year", "5 Year", "10 Year", "15 Year", "20 Year");

    private static final Map<String, Period> HORIZON_PERIOD_BY_LABEL = Map.of(
            "1 Year", Period.ONE_YEAR,
            "3 Year", Period.THREE_YEAR,
            "5 Year", Period.FIVE_YEAR,
            "10 Year", Period.TEN_YEAR,
            "15 Year", Period.FIFTEEN_YEAR);

    private final RollingReturnsPort rollingReturnsPort;
    private final PeerDiscoveryService peerDiscoveryService;
    private final PeerFundSnapshotPort peerFundSnapshotPort;
    private final PeerComparisonSnapshotPort peerComparisonSnapshotPort;
    private final FeatureGuard featureGuard;
    private final UpstreamProperties upstreamProperties;
    private final MetricsCalculator metricsCalculator;
    private final ObjectMapper objectMapper;
    private final Executor upstreamExecutor;
    private final Executor computeExecutor;
    private final SingleFlightCoordinator singleFlightCoordinator;
    private final Clock clock;
    private final Set<String> refreshingKeys = ConcurrentHashMap.newKeySet();

    public PeerComparisonService(
            RollingReturnsPort rollingReturnsPort,
            PeerDiscoveryService peerDiscoveryService,
            PeerFundSnapshotPort peerFundSnapshotPort,
            PeerComparisonSnapshotPort peerComparisonSnapshotPort,
            FeatureGuard featureGuard,
            AnalyticsProperties analyticsProperties,
            UpstreamProperties upstreamProperties,
            Clock clock,
            ObjectMapper objectMapper,
            @Qualifier("upstreamExecutor") Executor upstreamExecutor,
            @Qualifier("computeExecutor") Executor computeExecutor,
            SingleFlightCoordinator singleFlightCoordinator) {
        this.rollingReturnsPort = rollingReturnsPort;
        this.peerDiscoveryService = peerDiscoveryService;
        this.peerFundSnapshotPort = peerFundSnapshotPort;
        this.peerComparisonSnapshotPort = peerComparisonSnapshotPort;
        this.featureGuard = featureGuard;
        this.upstreamProperties = upstreamProperties;
        this.objectMapper = objectMapper;
        this.upstreamExecutor = upstreamExecutor;
        this.computeExecutor = computeExecutor;
        this.singleFlightCoordinator = singleFlightCoordinator;
        this.clock = clock;
        this.metricsCalculator = new MetricsCalculator(
                analyticsProperties.riskFreeRate(), analyticsProperties.tradingDays(), clock);
    }

    @Override
    public PeerComparisonReport compare(String scheme, String category) {
        featureGuard.require(FeatureKeys.ANALYSIS_PEER_COMPARISON);

        String normalizedCategory = normalizeCategory(category);
        String startDate = upstreamProperties.defaultStartDate();
        String flightKey = comparisonKey(scheme, normalizedCategory, startDate);

        return singleFlightCoordinator.run(flightKey, () -> loadComparison(scheme, normalizedCategory, startDate));
    }

    private PeerComparisonReport loadComparison(String scheme, String category, String startDate) {
        Optional<Instant> liveWatermark = latestRollingWatermark(scheme, startDate);
        Optional<PeerComparisonSnapshot> stored =
                peerComparisonSnapshotPort.find(scheme, category, startDate);

        if (stored.isPresent() && stored.get().schemaVersion() == PEER_SCHEMA_VERSION) {
            PeerComparisonReport report = PeerSnapshotMapper.readComparisonReport(stored.get(), objectMapper);
            if (isFresh(stored.get().watermarkNavDate(), liveWatermark)) {
                return report;
            }
            scheduleRefresh(scheme, category, startDate);
            return report;
        }

        return materializeComparison(scheme, category, startDate);
    }

    private PeerComparisonReport materializeComparison(String scheme, String category, String startDate) {
        List<String> peerNames = peerDiscoveryService.findPeers(scheme, category);

        List<String> schemes = new ArrayList<>(peerNames.size() + 1);
        schemes.add(scheme);
        schemes.addAll(peerNames);

        List<CompletableFuture<PeerComparisonReport.PeerRow>> futures = schemes.stream()
                .map(name -> CompletableFuture.supplyAsync(
                        () -> resolvePeerRow(name, name.equals(scheme), startDate),
                        upstreamExecutor))
                .toList();

        List<PeerComparisonReport.PeerRow> rows = futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(PeerComparisonReport.PeerRow::average).reversed())
                .toList();

        List<String> highlights = buildHighlights(rows);
        PeerComparisonReport.LongRunAnalysis longRunAnalysis = buildLongRunAnalysis(rows, category, startDate);
        PeerComparisonReport report =
                new PeerComparisonReport(rows, highlights, Period.Labels.FIVE_YEAR, longRunAnalysis);

        persistComparison(scheme, category, startDate, peerNames, report);
        return report;
    }

    private PeerComparisonReport.PeerRow resolvePeerRow(
            String schemeName,
            boolean selected,
            String startDate) {
        Optional<Instant> liveWatermark = latestRollingWatermark(schemeName, startDate);
        Optional<PeerFundSnapshot> cached = peerFundSnapshotPort.find(schemeName, startDate);

        if (cached.isPresent() && cached.get().schemaVersion() == PEER_SCHEMA_VERSION) {
            if (isFresh(cached.get().watermarkNavDate(), liveWatermark)) {
                PeerComparisonReport.PeerRow row =
                        PeerSnapshotMapper.readFundRow(cached.get(), objectMapper);
                return withSelected(row, selected);
            }
        }

        PeerComparisonReport.PeerRow row = buildRowFromInvestt(schemeName, selected, startDate);
        if (row != null) {
            persistFundRow(schemeName, startDate, row, liveWatermark.orElse(null), cached);
        }
        return row;
    }

    /** Builds peer metrics from investt.in rolling returns — no mfapi NAV fetch per peer. */
    private PeerComparisonReport.PeerRow buildRowFromInvestt(
            String schemeName,
            boolean selected,
            String startDate) {
        try {
            RollingReturnsData fiveYear = rollingReturnsPort.fetch(
                    new AnalysisQuery(schemeName, Period.FIVE_YEAR, startDate));

            List<Double> returns = fiveYear.fund().stream()
                    .map(RollingReturnRow::schemeRollingReturns)
                    .toList();
            if (returns.isEmpty()) {
                return null;
            }

            FundMetrics metrics = metricsCalculator.compute(new AnalysisInput(
                    fiveYear.fund(), fiveYear.benchmark(), Period.Labels.FIVE_YEAR));
            DoubleSummaryStatistics summary = returns.stream().mapToDouble(Double::doubleValue).summaryStatistics();

            List<PeerComparisonReport.HorizonReturn> horizons =
                    buildHorizonReturnsFromInvestt(schemeName, startDate, fiveYear);

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
                    horizons);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private List<PeerComparisonReport.HorizonReturn> buildHorizonReturnsFromInvestt(
            String schemeName,
            String startDate,
            RollingReturnsData fiveYearData) {
        Map<String, CompletableFuture<RollingReturnsData>> pending = new LinkedHashMap<>();
        for (String label : LONG_RUN_HORIZONS) {
            if ("5 Year".equals(label)) {
                continue;
            }
            Period period = HORIZON_PERIOD_BY_LABEL.get(label);
            if (period == null) {
                continue;
            }
            pending.put(label, CompletableFuture.supplyAsync(
                    () -> rollingReturnsPort.fetch(new AnalysisQuery(schemeName, period, startDate)),
                    upstreamExecutor));
        }

        List<PeerComparisonReport.HorizonReturn> horizons = new ArrayList<>(LONG_RUN_HORIZONS.size());
        for (String label : LONG_RUN_HORIZONS) {
            try {
                RollingReturnsData data = "5 Year".equals(label)
                        ? fiveYearData
                        : pending.containsKey(label) ? pending.get(label).join() : null;
                horizons.add(toHorizonReturn(label, data));
            } catch (RuntimeException ignored) {
                horizons.add(new PeerComparisonReport.HorizonReturn(label, null, null));
            }
        }
        return horizons;
    }

    private static PeerComparisonReport.HorizonReturn toHorizonReturn(String label, RollingReturnsData data) {
        if (data == null || data.fund().isEmpty()) {
            return new PeerComparisonReport.HorizonReturn(label, null, null);
        }
        double avg = data.fund().stream()
                .mapToDouble(RollingReturnRow::schemeRollingReturns)
                .average()
                .orElse(Double.NaN);
        if (!Double.isFinite(avg)) {
            return new PeerComparisonReport.HorizonReturn(label, null, null);
        }
        int years = horizonYears(label);
        Double multiple = years > 0 ? moneyMultiple(avg, years) : null;
        return new PeerComparisonReport.HorizonReturn(label, avg, multiple);
    }

    private PeerComparisonReport.LongRunAnalysis buildLongRunAnalysis(
            List<PeerComparisonReport.PeerRow> rows,
            String category,
            String startDate) {
        String categoryLabel = category == null || category.isBlank() || "All".equals(category)
                ? "Category peers"
                : category;

        String asOfDate = rows.stream()
                .filter(PeerComparisonReport.PeerRow::selected)
                .findFirst()
                .flatMap(row -> peerFundSnapshotPort.find(row.scheme(), startDate)
                        .map(PeerFundSnapshot::watermarkNavDate))
                .or(() -> rows.stream()
                        .findFirst()
                        .flatMap(row -> latestRollingWatermark(row.scheme(), startDate)))
                .map(instant -> DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH)
                        .withZone(ZoneOffset.UTC)
                        .format(instant))
                .orElse("");

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

    private Optional<Instant> latestRollingWatermark(String schemeName, String startDate) {
        try {
            RollingReturnsData data = rollingReturnsPort.fetch(
                    new AnalysisQuery(schemeName, Period.FIVE_YEAR, startDate));
            return watermarkFromRolling(data);
        } catch (RuntimeException ignored) {
            return Optional.empty();
        }
    }

    private static Optional<Instant> watermarkFromRolling(RollingReturnsData data) {
        return data.fund().stream()
                .map(row -> NavDateParser.parse(row.schemeForwardDate()))
                .flatMap(Optional::stream)
                .max(Instant::compareTo);
    }

    private void persistFundRow(
            String schemeName,
            String startDate,
            PeerComparisonReport.PeerRow row,
            Instant watermark,
            Optional<PeerFundSnapshot> existing) {
        PeerComparisonReport.PeerRow cachePayload = withSelected(row, false);
        peerFundSnapshotPort.save(new PeerFundSnapshot(
                schemeName,
                startDate,
                PeerSnapshotMapper.writeJson(cachePayload, objectMapper),
                watermark,
                clock.instant(),
                PEER_SCHEMA_VERSION,
                existing.map(PeerFundSnapshot::version).orElse(0L)));
    }

    private void persistComparison(
            String scheme,
            String category,
            String startDate,
            List<String> peerNames,
            PeerComparisonReport report) {
        Instant watermark = latestRollingWatermark(scheme, startDate).orElse(null);
        Optional<PeerComparisonSnapshot> existing =
                peerComparisonSnapshotPort.find(scheme, category, startDate);

        peerComparisonSnapshotPort.save(new PeerComparisonSnapshot(
                scheme,
                category,
                startDate,
                PeerSnapshotMapper.writeJson(peerNames, objectMapper),
                PeerSnapshotMapper.writeJson(report, objectMapper),
                watermark,
                clock.instant(),
                PEER_SCHEMA_VERSION,
                existing.map(PeerComparisonSnapshot::version).orElse(0L)));
    }

    private void scheduleRefresh(String scheme, String category, String startDate) {
        String key = refreshKey(scheme, category, startDate);
        if (!refreshingKeys.add(key)) {
            return;
        }
        computeExecutor.execute(() -> {
            try {
                singleFlightCoordinator.run(key, () -> {
                    materializeComparison(scheme, category, startDate);
                    return null;
                });
            } finally {
                refreshingKeys.remove(key);
            }
        });
    }

    private static boolean isFresh(Instant storedWatermark, Optional<Instant> liveWatermark) {
        if (storedWatermark == null) {
            return false;
        }
        return liveWatermark.isEmpty() || Objects.equals(storedWatermark, liveWatermark.get());
    }

    private static PeerComparisonReport.PeerRow withSelected(
            PeerComparisonReport.PeerRow row,
            boolean selected) {
        return new PeerComparisonReport.PeerRow(
                row.scheme(),
                row.average(),
                row.maximum(),
                row.minimum(),
                row.stdDev(),
                row.cob(),
                row.totalRecords(),
                row.sharpe(),
                row.maxDrawdown(),
                row.consistencyScore(),
                selected,
                row.horizonReturns());
    }

    private static int horizonYears(String label) {
        return switch (label) {
            case "1 Year" -> 1;
            case "3 Year" -> 3;
            case "5 Year" -> 5;
            case "10 Year" -> 10;
            case "15 Year" -> 15;
            case "20 Year" -> 20;
            default -> 0;
        };
    }

    private static double moneyMultiple(double cagrPercent, int years) {
        return Math.pow(1 + cagrPercent / 100.0, years);
    }

    private static String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "All";
        }
        return category.trim();
    }

    private static String comparisonKey(String scheme, String category, String startDate) {
        return "peer-comparison:" + scheme + ":" + category + ":" + startDate;
    }

    private static String refreshKey(String scheme, String category, String startDate) {
        return "peer-refresh:" + scheme + ":" + category + ":" + startDate;
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
