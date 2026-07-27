package in.goldentriangle.mfa.domain.model.report;

import java.util.List;

public record PeerComparisonReport(
        List<PeerRow> peers,
        List<String> highlights,
        String periodLabel,
        LongRunAnalysis longRunAnalysis) {

    public record PeerRow(
            String scheme,
            double average,
            double maximum,
            double minimum,
            double stdDev,
            double cob,
            int totalRecords,
            double sharpe,
            double maxDrawdown,
            double consistencyScore,
            boolean selected,
            List<HorizonReturn> horizonReturns) {
    }

    public record HorizonReturn(String label, Double cagrPercent, Double moneyMultiplied) {
    }

    public record LongRunAnalysis(
            String categoryLabel,
            String asOfDate,
            List<String> horizonLabels,
            Double twentyYearCagrLow,
            Double twentyYearCagrHigh,
            Double twentyYearMultiplyLow,
            Double twentyYearMultiplyHigh) {
    }
}
