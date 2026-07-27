package in.goldentriangle.mfa.adapter.in.web.dto.compare;

import java.util.List;

public record PeerComparisonDto(
        List<PeerRowDto> peers,
        List<String> highlights,
        String periodLabel,
        LongRunAnalysisDto longRunAnalysis) {

    public record PeerRowDto(
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
            List<HorizonReturnDto> horizonReturns) {
    }

    public record HorizonReturnDto(String label, Double cagrPercent, Double moneyMultiplied) {
    }

    public record LongRunAnalysisDto(
            String categoryLabel,
            String asOfDate,
            List<String> horizonLabels,
            Double twentyYearCagrLow,
            Double twentyYearCagrHigh,
            Double twentyYearMultiplyLow,
            Double twentyYearMultiplyHigh) {
    }
}
