package in.goldentriangle.mfa.domain.analytics.report.matrix;

import in.goldentriangle.mfa.domain.analytics.NavSeriesOrder;
import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.matrix.MultiplyOddsReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MultiplyOddsCalculator {

    private static final int MIN_HORIZON_YEARS = 5;
    private static final int MAX_HORIZON_YEARS = 15;
    private static final int MIN_SAMPLES = 30;
    private static final int[] MULTIPLY_TARGETS = {2, 3, 4, 5};
    private static final int MAX_END_SLIP_DAYS = 10;

    private static final DateTimeFormatter PERIOD_FMT =
            DateTimeFormatter.ofPattern("MMM-yy", Locale.ENGLISH).withZone(ZoneOffset.UTC);

    public MultiplyOddsReport compute(List<NavPoint> fundNav) {
        List<NavPoint> series = NavSeriesOrder.dedupeAndSort(fundNav);
        if (series.size() < 2) {
            return empty();
        }

        Instant first = series.get(0).date();
        Instant last = series.get(series.size() - 1).date();
        double historyYears = CalendarMath.yearsBetweenMillis(first.toEpochMilli(), last.toEpochMilli());
        int maxHorizon = Math.min(MAX_HORIZON_YEARS, (int) Math.floor(historyYears));
        if (maxHorizon < MIN_HORIZON_YEARS) {
            return empty();
        }

        List<Integer> holdingYears = new ArrayList<>();
        for (int h = MIN_HORIZON_YEARS; h <= maxHorizon; h++) {
            holdingYears.add(h);
        }

        int horizonCount = holdingYears.size();
        List<List<Double>> multiplesByHorizon = new ArrayList<>();
        for (int i = 0; i < horizonCount; i++) {
            multiplesByHorizon.add(new ArrayList<>());
        }

        for (NavPoint startPoint : series) {
            Instant start = startPoint.date();
            if (startPoint.nav() <= 0) {
                continue;
            }
            for (int i = 0; i < horizonCount; i++) {
                int horizonYears = holdingYears.get(i);
                Instant targetEnd = start.atZone(ZoneOffset.UTC).plusYears(horizonYears).toInstant();
                if (targetEnd.isAfter(last)) {
                    continue;
                }
                var endPoint = NavLookup.navOnOrAfter(series, targetEnd)
                        .filter(p -> ChronoUnit.DAYS.between(targetEnd, p.date()) <= MAX_END_SLIP_DAYS);
                if (endPoint.isEmpty() || !start.isBefore(endPoint.get().date())) {
                    continue;
                }
                multiplesByHorizon.get(i).add(CalendarMath.moneyMultiplied(startPoint.nav(), endPoint.get().nav()));
            }
        }

        List<MultiplyOddsReport.MultiplyRow> rows = new ArrayList<>();
        for (int target : MULTIPLY_TARGETS) {
            List<MultiplyOddsReport.OddsCell> cells = new ArrayList<>();
            for (int i = 0; i < horizonCount; i++) {
                int horizon = holdingYears.get(i);
                List<Double> values = multiplesByHorizon.get(i);
                if (values.size() < MIN_SAMPLES) {
                    cells.add(new MultiplyOddsReport.OddsCell(horizon, null, values.size(), 0));
                    continue;
                }
                long hits = values.stream().filter(v -> v >= target).count();
                double percent = hits * 100.0 / values.size();
                cells.add(new MultiplyOddsReport.OddsCell(horizon, percent, values.size(), (int) hits));
            }
            List<Integer> highlightYears = findBestAdjacentPair(cells);
            Double calloutPercent = averagePair(cells, highlightYears);
            rows.add(new MultiplyOddsReport.MultiplyRow(target, cells, highlightYears, calloutPercent));
        }

        String periodLabel = "since inception " + PERIOD_FMT.format(first) + " to " + PERIOD_FMT.format(last);
        String headline = buildHeadline(rows);

        return new MultiplyOddsReport(periodLabel, holdingYears, rows, headline);
    }

    private static MultiplyOddsReport empty() {
        return new MultiplyOddsReport("", List.of(), List.of(), "");
    }

    private static List<Integer> findBestAdjacentPair(List<MultiplyOddsReport.OddsCell> cells) {
        List<Integer> bestPair = null;
        double bestAvg = -1;
        for (int i = 0; i < cells.size() - 1; i++) {
            Double a = cells.get(i).percent();
            Double b = cells.get(i + 1).percent();
            if (a == null || b == null) {
                continue;
            }
            double avg = (a + b) / 2;
            if (bestPair == null || avg > bestAvg) {
                bestAvg = avg;
                bestPair = List.of(cells.get(i).holdingYears(), cells.get(i + 1).holdingYears());
            }
        }
        return bestPair;
    }

    private static Double averagePair(List<MultiplyOddsReport.OddsCell> cells, List<Integer> highlightYears) {
        if (highlightYears == null || highlightYears.size() < 2) {
            return null;
        }
        Double a = cells.stream()
                .filter(c -> c.holdingYears() == highlightYears.get(0))
                .map(MultiplyOddsReport.OddsCell::percent)
                .findFirst()
                .orElse(null);
        Double b = cells.stream()
                .filter(c -> c.holdingYears() == highlightYears.get(1))
                .map(MultiplyOddsReport.OddsCell::percent)
                .findFirst()
                .orElse(null);
        if (a == null || b == null) {
            return null;
        }
        return (a + b) / 2;
    }

    private static String buildHeadline(List<MultiplyOddsReport.MultiplyRow> rows) {
        MultiplyOddsReport.MultiplyRow triple = rows.stream()
                .filter(r -> r.multiply() == 3 && r.calloutPercent() != null)
                .findFirst()
                .orElse(rows.size() > 1 ? rows.get(1) : null);
        if (triple == null || triple.highlightYears() == null || triple.calloutPercent() == null) {
            return "Historical probability of reaching target multiples by holding period";
        }
        return Math.round(triple.calloutPercent())
                + "% of the times investments tripled in "
                + triple.highlightYears().get(0)
                + "-"
                + triple.highlightYears().get(1)
                + " years";
    }
}
