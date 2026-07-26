package in.goldentriangle.mfa.domain.analytics.report.matrix;

import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.report.sip.Xirr;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.matrix.ReturnBand;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.TreeSet;

public class MatrixCalculator {

    private static final int STP_MONTHS = 6;
    /** Allow January-labelled rows when the first trading NAV is a few days into the year. */
    private static final int MAX_START_SLIP_DAYS = 10;

    public MatrixReport compute(NavHistory history, MatrixMode mode) {
        List<NavPoint> nav = history.fundNav();
        if (nav.isEmpty()) {
            return empty(mode);
        }

        // Prefer the assembled history bounds so forward-looking rolling-return NAV points do not
        // invent future start years with no real holding data.
        Instant first = history.firstNavDate() != null ? history.firstNavDate() : nav.get(0).date();
        Instant last = history.lastNavDate() != null ? history.lastNavDate() : nav.get(nav.size() - 1).date();
        int minYear = first.atZone(ZoneOffset.UTC).getYear();
        int maxYear = last.atZone(ZoneOffset.UTC).getYear();
        if (maxYear <= minYear) {
            TreeSet<Integer> startYears = new TreeSet<>();
            for (NavPoint point : nav) {
                startYears.add(point.date().atZone(ZoneOffset.UTC).getYear());
            }
            minYear = startYears.first();
            maxYear = startYears.last();
        }
        int maxHorizon = maxYear - minYear;
        List<Integer> holdingYears = new ArrayList<>();
        for (int h = 1; h <= maxHorizon; h++) {
            holdingYears.add(h);
        }

        List<MatrixReport.MatrixDataRow> dataRows = new ArrayList<>();
        List<List<Double>> columnValues = new ArrayList<>();
        for (int h = 0; h < holdingYears.size(); h++) {
            columnValues.add(new ArrayList<>());
        }

        for (int startYear = minYear; startYear <= maxYear; startYear++) {
            Instant start = Instant.parse(startYear + "-01-01T00:00:00Z");
            List<MatrixReport.MatrixCell> cells = new ArrayList<>();
            for (int h = 1; h <= maxHorizon; h++) {
                int endYear = startYear + h;
                if (endYear > maxYear) {
                    cells.add(new MatrixReport.MatrixCell(h, null, null));
                    continue;
                }
                Instant end = Instant.parse(endYear + "-01-01T00:00:00Z");
                Double value = computeCell(nav, start, end, mode);
                ReturnBand band = value == null ? null : bandFor(mode, value);
                cells.add(new MatrixReport.MatrixCell(h, value, band));
                if (value != null && h - 1 < columnValues.size()) {
                    columnValues.get(h - 1).add(value);
                }
            }
            dataRows.add(new MatrixReport.MatrixDataRow(formatStartLabel(startYear), cells));
        }

        List<String> startLabels = dataRows.stream().map(MatrixReport.MatrixDataRow::startLabel).toList();
        List<MatrixReport.MatrixRow> summaryRows = List.of(
                summaryRow("Average", columnValues, null),
                summaryRow("Max", columnValues, true),
                summaryRow("Min", columnValues, false));

        return new MatrixReport(mode, startLabels, holdingYears, summaryRows, dataRows);
    }

    private ReturnBand bandFor(MatrixMode mode, double value) {
        if (mode == MatrixMode.MULTIPLE) {
            double impliedCagr = value <= 0 ? 0 : (Math.pow(value, 1.0 / 7) - 1) * 100;
            return ReturnBandClassifier.classify(impliedCagr);
        }
        return ReturnBandClassifier.classify(value);
    }

    private Double computeCell(List<NavPoint> nav, Instant start, Instant end, MatrixMode mode) {
        return switch (mode) {
            case LUMPSUM -> lumpsumReturn(nav, start, end, false);
            case MULTIPLE -> lumpsumReturn(nav, start, end, true);
            case SIP -> sipCagr(nav, start, end);
            case STP_6M -> stpCagr(nav, start, end);
        };
    }

    /**
     * Year-start matrices need the first available NAV on/after the start and the last NAV on/before
     * the end. A tight "nearest within 7 days" match fails when NAV is reconstructed from rolling
     * returns (sparse around 1 Jan), which left every cell empty.
     */
    private Double lumpsumReturn(List<NavPoint> nav, Instant start, Instant end, boolean asMultiple) {
        Optional<NavPoint> startNav = NavLookup.navOnOrAfter(nav, start);
        Optional<NavPoint> endNav = NavLookup.navOnOrBefore(nav, end);
        if (startNav.isEmpty() || endNav.isEmpty()) {
            return null;
        }
        if (!startNav.get().date().isBefore(endNav.get().date())) {
            return null;
        }
        // Reject starts that are far after the labelled year (e.g. fund launched mid-year).
        if (ChronoUnit.DAYS.between(start, startNav.get().date()) > MAX_START_SLIP_DAYS) {
            return null;
        }
        if (asMultiple) {
            return CalendarMath.moneyMultiplied(startNav.get().nav(), endNav.get().nav());
        }
        double years = CalendarMath.yearsBetweenMillis(
                startNav.get().date().toEpochMilli(), endNav.get().date().toEpochMilli());
        return CalendarMath.cagr(startNav.get().nav(), endNav.get().nav(), years);
    }

    private Double sipCagr(List<NavPoint> nav, Instant start, Instant end) {
        List<Xirr.CashFlow> flows = new ArrayList<>();
        long baseDay = start.toEpochMilli() / (24 * 60 * 60 * 1000);
        Instant cursor = start;
        double units = 0;
        int installments = 0;
        while (!cursor.isAfter(end)) {
            Instant installmentDate = cursor;
            Optional<NavPoint> point = NavLookup.navOnOrAfter(nav, installmentDate)
                    .filter(p -> ChronoUnit.DAYS.between(installmentDate, p.date()) <= MAX_START_SLIP_DAYS);
            if (point.isPresent() && point.get().nav() > 0) {
                units += 1.0 / point.get().nav();
                installments++;
                long day = point.get().date().toEpochMilli() / (24 * 60 * 60 * 1000);
                flows.add(new Xirr.CashFlow(day - baseDay, -1));
            }
            cursor = cursor.atZone(ZoneOffset.UTC).plusMonths(1).toInstant();
        }
        Optional<NavPoint> endPoint = NavLookup.navOnOrBefore(nav, end);
        if (endPoint.isEmpty() || units == 0 || installments < 2) {
            return null;
        }
        double finalValue = units * endPoint.get().nav();
        long endDay = endPoint.get().date().toEpochMilli() / (24 * 60 * 60 * 1000);
        flows.add(new Xirr.CashFlow(endDay - baseDay, finalValue));
        return Xirr.compute(flows);
    }

    private Double stpCagr(List<NavPoint> nav, Instant start, Instant end) {
        Instant deployEnd = start.atZone(ZoneOffset.UTC).plusMonths(STP_MONTHS).toInstant();
        if (deployEnd.isAfter(end)) {
            return null;
        }
        return sipCagr(nav, start, end);
    }

    private MatrixReport.MatrixRow summaryRow(String label, List<List<Double>> columns, Boolean max) {
        List<Double> values = new ArrayList<>();
        for (List<Double> col : columns) {
            if (col.isEmpty()) {
                values.add(null);
                continue;
            }
            if (max == null) {
                values.add(col.stream().mapToDouble(Double::doubleValue).average().orElse(0));
            } else if (max) {
                values.add(col.stream().mapToDouble(Double::doubleValue).max().orElse(0));
            } else {
                values.add(col.stream().mapToDouble(Double::doubleValue).min().orElse(0));
            }
        }
        return new MatrixReport.MatrixRow(label, values);
    }

    private String formatStartLabel(int year) {
        return "Jan-" + String.format(Locale.ENGLISH, "%02d", year % 100);
    }

    private MatrixReport empty(MatrixMode mode) {
        return new MatrixReport(mode, List.of(), List.of(), List.of(), List.of());
    }
}
