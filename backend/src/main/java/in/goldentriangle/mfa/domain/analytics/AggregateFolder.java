package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.AlignedRollingPoint;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.WelfordAccumulator;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public final class AggregateFolder {

    private static final long INITIAL_VERSION = 0;

    private AggregateFolder() {
    }

    public static RollingAggregate fold(
            String scheme,
            Period period,
            RollingReturnsData data,
            Instant watermarkExclusive,
            Instant computedAt) {
        List<RollingReturnRow> fundRows = filterAfterWatermark(data.fund(), watermarkExclusive);
        List<RollingReturnRow> benchmarkRows = filterAfterWatermark(data.benchmark(), watermarkExclusive);

        if (fundRows.isEmpty() && benchmarkRows.isEmpty()) {
            return RollingAggregate.empty(scheme, period);
        }

        WelfordAccumulator fundStats = WelfordAccumulator.empty();
        for (RollingReturnRow row : fundRows) {
            fundStats.add(row.schemeRollingReturns());
        }

        WelfordAccumulator indexStats = WelfordAccumulator.empty();
        for (RollingReturnRow row : benchmarkRows) {
            indexStats.add(row.schemeRollingReturns());
        }

        List<AlignedRollingPoint> aligned = NavSeriesBuilder.alignRollingReturns(fundRows, benchmarkRows);
        long fundWinCount = aligned.stream().filter(p -> p.fundReturn() > p.benchmarkReturn()).count();

        String fundName = data.fund().isEmpty() ? "" : data.fund().get(0).schemeName();
        String benchmarkName = data.benchmark().isEmpty() ? "" : data.benchmark().get(0).schemeName();
        String category = data.fund().isEmpty() ? "" : data.fund().get(0).schemeCategory();

        Instant newWatermark = computeWatermark(fundRows, benchmarkRows).orElse(null);

        return new RollingAggregate(
                scheme,
                period,
                fundName,
                benchmarkName,
                category,
                fundStats,
                indexStats,
                aligned.size(),
                fundWinCount,
                newWatermark,
                computedAt,
                INITIAL_VERSION);
    }

    public static RollingAggregate merge(RollingAggregate existing, RollingAggregate delta, Instant computedAt) {
        if (delta.fundStats().count() == 0 && delta.indexStats().count() == 0) {
            return existing;
        }

        WelfordAccumulator mergedFund = existing.fundStats().copy();
        mergedFund.merge(delta.fundStats());

        WelfordAccumulator mergedIndex = existing.indexStats().copy();
        mergedIndex.merge(delta.indexStats());

        long alignedCount = existing.alignedCount() + delta.alignedCount();
        long fundWinCount = existing.fundWinCount() + delta.fundWinCount();

        String fundName = existing.fundName().isBlank() ? delta.fundName() : existing.fundName();
        String benchmarkName = existing.benchmarkName().isBlank() ? delta.benchmarkName() : existing.benchmarkName();
        String category = existing.category().isBlank() ? delta.category() : existing.category();

        Instant watermark = pickLater(existing.watermarkNavDate(), delta.watermarkNavDate());

        return new RollingAggregate(
                existing.scheme(),
                existing.period(),
                fundName,
                benchmarkName,
                category,
                mergedFund,
                mergedIndex,
                alignedCount,
                fundWinCount,
                watermark,
                computedAt,
                existing.version());
    }

    private static List<RollingReturnRow> filterAfterWatermark(
            List<RollingReturnRow> rows,
            Instant watermarkExclusive) {
        if (watermarkExclusive == null) {
            return rows;
        }
        return rows.stream()
                .filter(row -> NavDateParser.parse(row.navDate())
                        .filter(date -> date.isAfter(watermarkExclusive))
                        .isPresent())
                .toList();
    }

    public static Optional<Instant> computeWatermark(
            List<RollingReturnRow> fundRows,
            List<RollingReturnRow> benchmarkRows) {
        Optional<Instant> lastFund = maxNavDate(fundRows);
        Optional<Instant> lastBenchmark = maxNavDate(benchmarkRows);
        if (lastFund.isEmpty() || lastBenchmark.isEmpty()) {
            return lastFund.or(() -> lastBenchmark);
        }
        return Optional.of(earlier(lastFund.get(), lastBenchmark.get()));
    }

    private static Optional<Instant> maxNavDate(List<RollingReturnRow> rows) {
        return rows.stream()
                .map(row -> NavDateParser.parse(row.navDate()))
                .flatMap(Optional::stream)
                .max(Comparator.naturalOrder());
    }

    private static Instant earlier(Instant a, Instant b) {
        return a.isBefore(b) ? a : b;
    }

    private static Instant pickLater(Instant a, Instant b) {
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        return a.isAfter(b) ? a : b;
    }
}
