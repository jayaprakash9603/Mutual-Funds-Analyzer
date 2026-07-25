package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.ProbabilityReport;

import java.util.List;

public class ProbabilityCalculator {

    private static final double INFLATION_RATE = 7;
    private static final double DOUBLE_THRESHOLD = 100;
    private static final double TRIPLE_THRESHOLD = 200;

    public ProbabilityReport compute(RollingReturnsData data) {
        List<RollingReturnRow> fund = data.fund();
        if (fund.isEmpty()) {
            return new ProbabilityReport(0, 0, 0, 0, 0, 0);
        }

        List<Double> returns = fund.stream().map(RollingReturnRow::schemeRollingReturns).toList();
        double positive = RollingBandCalculator.percentAbove(returns, 0.01);
        double beatInflation = RollingBandCalculator.percentAbove(returns, INFLATION_RATE);
        double above10 = RollingBandCalculator.percentAbove(returns, 10);

        List<Double> alignedFund = fund.stream().map(RollingReturnRow::schemeRollingReturns).toList();
        List<Double> alignedBench = data.benchmark().stream().map(RollingReturnRow::schemeRollingReturns).toList();
        int min = Math.min(alignedFund.size(), alignedBench.size());
        double beatBench = 0;
        if (min > 0) {
            long wins = 0;
            for (int i = 0; i < min; i++) {
                if (alignedFund.get(i) > alignedBench.get(i)) {
                    wins++;
                }
            }
            beatBench = wins * 100.0 / min;
        }

        double doubleMoney = estimateMultiplyProbability(returns, 2);
        double tripleMoney = estimateMultiplyProbability(returns, 3);

        return new ProbabilityReport(positive, beatInflation, beatBench, above10, doubleMoney, tripleMoney);
    }

    private double estimateMultiplyProbability(List<Double> cagrReturns, int multiplier) {
        if (cagrReturns.isEmpty()) {
            return 0;
        }
        double threshold = (Math.pow(multiplier, 1.0 / 7) - 1) * 100;
        return RollingBandCalculator.percentAbove(cagrReturns, threshold);
    }
}
