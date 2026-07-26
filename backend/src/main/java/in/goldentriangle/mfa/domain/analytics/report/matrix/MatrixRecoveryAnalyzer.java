package in.goldentriangle.mfa.domain.analytics.report.matrix;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixRecoveryAnalysis;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReport;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public final class MatrixRecoveryAnalyzer {

    private static final int DEFAULT_BASELINE_YEARS = 7;
    private static final double STRONG_THRESHOLD = 10.0;

    private MatrixRecoveryAnalyzer() {
    }

    public static MatrixRecoveryAnalysis analyze(MatrixReport report) {
        if (report.dataRows().isEmpty() || report.holdingYears().isEmpty()) {
            return MatrixRecoveryAnalysis.empty();
        }

        int baselineYears = resolveBaselineYears(report.holdingYears());
        List<MatrixRecoveryAnalysis.RecoveryRow> rows = new ArrayList<>();
        int belowBaseline = 0;
        int recovered = 0;
        int neverRecovered = 0;
        int maxExtension = 0;

        for (MatrixReport.MatrixDataRow dataRow : report.dataRows()) {
            Optional<MatrixReport.MatrixCell> baselineCell = cellAt(dataRow, baselineYears);
            if (baselineCell.isEmpty() || baselineCell.get().value() == null) {
                continue;
            }

            double baselineReturn = comparableReturn(
                    report.mode(), baselineYears, baselineCell.get().value());
            if (baselineReturn >= STRONG_THRESHOLD) {
                continue;
            }

            belowBaseline++;
            Optional<MatrixReport.MatrixCell> recoveryCell = findRecoveryCell(
                    dataRow, baselineYears, report.mode());
            if (recoveryCell.isPresent()) {
                recovered++;
                int extension = recoveryCell.get().holdingYears() - baselineYears;
                maxExtension = Math.max(maxExtension, extension);
                rows.add(new MatrixRecoveryAnalysis.RecoveryRow(
                        dataRow.startLabel(),
                        baselineReturn,
                        recoveryCell.get().holdingYears(),
                        comparableReturn(report.mode(), recoveryCell.get().holdingYears(), recoveryCell.get().value()),
                        true,
                        false));
            } else {
                neverRecovered++;
                rows.add(new MatrixRecoveryAnalysis.RecoveryRow(
                        dataRow.startLabel(),
                        baselineReturn,
                        null,
                        null,
                        false,
                        true));
            }
        }

        List<String> exceptions = rows.stream()
                .filter(MatrixRecoveryAnalysis.RecoveryRow::exception)
                .map(MatrixRecoveryAnalysis.RecoveryRow::startLabel)
                .toList();

        double recoveryRate = belowBaseline == 0 ? 100.0 : recovered * 100.0 / belowBaseline;
        String headline = buildHeadline(baselineYears);
        String summary = buildSummary(
                baselineYears, belowBaseline, recovered, neverRecovered, maxExtension, recoveryRate, exceptions);

        return new MatrixRecoveryAnalysis(
                baselineYears,
                STRONG_THRESHOLD,
                belowBaseline,
                recovered,
                neverRecovered,
                recoveryRate,
                maxExtension == 0 ? null : maxExtension,
                rows,
                exceptions,
                headline,
                summary);
    }

    private static int resolveBaselineYears(List<Integer> holdingYears) {
        if (holdingYears.contains(DEFAULT_BASELINE_YEARS)) {
            return DEFAULT_BASELINE_YEARS;
        }
        return holdingYears.stream()
                .filter(y -> y <= DEFAULT_BASELINE_YEARS)
                .max(Comparator.naturalOrder())
                .orElse(holdingYears.get(0));
    }

    private static Optional<MatrixReport.MatrixCell> cellAt(MatrixReport.MatrixDataRow row, int holdingYears) {
        return row.cells().stream()
                .filter(c -> c.holdingYears() == holdingYears)
                .findFirst();
    }

    private static Optional<MatrixReport.MatrixCell> findRecoveryCell(
            MatrixReport.MatrixDataRow row, int baselineYears, MatrixMode mode) {
        return row.cells().stream()
                .filter(c -> c.holdingYears() > baselineYears && c.value() != null)
                .filter(c -> comparableReturn(mode, c.holdingYears(), c.value()) >= STRONG_THRESHOLD)
                .min(Comparator.comparingInt(MatrixReport.MatrixCell::holdingYears));
    }

    private static double comparableReturn(MatrixMode mode, int holdingYears, double value) {
        if (mode == MatrixMode.MULTIPLE) {
            if (value <= 0 || holdingYears <= 0) {
                return 0;
            }
            return (Math.pow(value, 1.0 / holdingYears) - 1) * 100;
        }
        return value;
    }

    private static String buildHeadline(int baselineYears) {
        return String.format(
                Locale.ENGLISH,
                "In rare instances where %d year returns were < 10%%, extending the time frame by a few years helped to recover performance",
                baselineYears);
    }

    private static String buildSummary(
            int baselineYears,
            int belowBaseline,
            int recovered,
            int neverRecovered,
            int maxExtension,
            double recoveryRate,
            List<String> exceptions) {
        if (belowBaseline == 0) {
            return String.format(
                    Locale.ENGLISH,
                    "Every tracked start date with a %d-year horizon reached at least 10%% annualised return.",
                    baselineYears);
        }

        StringBuilder summary = new StringBuilder();
        summary.append(String.format(
                Locale.ENGLISH,
                "Of %d start dates with %d-year returns below 10%%, %d recovered to 10%%+ by extending the holding period",
                belowBaseline,
                baselineYears,
                recovered));
        if (maxExtension > 0) {
            summary.append(String.format(Locale.ENGLISH, " (up to %d additional years)", maxExtension));
        }
        summary.append(String.format(Locale.ENGLISH, " — a %.0f%% recovery rate.", recoveryRate));

        if (neverRecovered > 0 && !exceptions.isEmpty()) {
            summary.append(" Except for investments starting ");
            summary.append(formatLabelList(exceptions));
            summary.append(", longer horizons restored double-digit returns in every other case.");
        }
        return summary.toString();
    }

    private static String formatLabelList(List<String> labels) {
        if (labels.size() == 1) {
            return labels.get(0);
        }
        if (labels.size() == 2) {
            return labels.get(0) + " and " + labels.get(1);
        }
        return String.join(", ", labels.subList(0, labels.size() - 1))
                + ", and "
                + labels.get(labels.size() - 1);
    }
}
