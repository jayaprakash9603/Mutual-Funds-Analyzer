package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.report.QualityScoreReport;

import java.util.ArrayList;
import java.util.List;

public class QualityScoreCalculator {

    /**
     * Scores only metrics we can compute from NAV / rolling data.
     * Expense ratio and diversification are omitted — metadata is not available.
     */
    public QualityScoreReport compute(FundMetrics metrics) {
        List<QualityScoreReport.ComponentScore> components = new ArrayList<>();

        int returnsScore = scoreReturn(metrics.totalReturn(), 50, 100);
        components.add(new QualityScoreReport.ComponentScore("Returns", returnsScore, 0.15));

        int rollingScore = scoreReturn(metrics.fundRollingAvg(), 10, 20);
        components.add(new QualityScoreReport.ComponentScore("Rolling Returns", rollingScore, 0.15));

        int sharpeScore = scoreReturn(metrics.fundSharpe(), 0.5, 1.5);
        components.add(new QualityScoreReport.ComponentScore("Sharpe", sharpeScore, 0.12));

        int consistencyScore = (int) Math.min(100, metrics.consistencyScore());
        components.add(new QualityScoreReport.ComponentScore("Consistency", consistencyScore, 0.15));

        int stdDevScore = scoreInverse(metrics.fundVolatility(), 10, 25);
        components.add(new QualityScoreReport.ComponentScore("Standard Deviation", stdDevScore, 0.13));

        int betaRiskScore = scoreInverse(Math.abs(metrics.beta()), 0.85, 1.45);
        components.add(new QualityScoreReport.ComponentScore("Beta Risk Level", betaRiskScore, 0.12));

        int benchmarkScore = (int) Math.min(100, metrics.cob());
        components.add(new QualityScoreReport.ComponentScore("Benchmark Outperformance", benchmarkScore, 0.18));

        double weighted = 0;
        double totalWeight = 0;
        for (QualityScoreReport.ComponentScore component : components) {
            weighted += component.score() * component.weight();
            totalWeight += component.weight();
        }
        int overall = totalWeight == 0 ? 0 : (int) Math.round(weighted / totalWeight);

        return new QualityScoreReport(overall, components);
    }

    private int scoreReturn(double value, double low, double high) {
        if (value <= low) {
            return 30;
        }
        if (value >= high) {
            return 100;
        }
        return (int) (30 + (value - low) / (high - low) * 70);
    }

    private int scoreInverse(double value, double good, double bad) {
        if (value <= good) {
            return 100;
        }
        if (value >= bad) {
            return 30;
        }
        return (int) (100 - (value - good) / (bad - good) * 70);
    }
}
