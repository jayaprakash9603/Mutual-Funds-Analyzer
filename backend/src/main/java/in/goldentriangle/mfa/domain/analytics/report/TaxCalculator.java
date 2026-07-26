package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.report.TaxReport;

public class TaxCalculator {

    private static final double STCG_RATE = 0.20;
    private static final double LTCG_RATE = 0.125;
    private static final double LTCG_EXEMPTION = 125_000;
    private static final int LTCG_HOLDING_YEARS = 1;

    public TaxReport compute(double totalReturnPercent, double holdingYears, double investedAmount) {
        double gain = investedAmount * totalReturnPercent / 100;
        return computeFromGain(gain, investedAmount, holdingYears);
    }

    public TaxReport computeFromGain(double gain, double investedAmount, double holdingYears) {
        boolean longTerm = holdingYears >= LTCG_HOLDING_YEARS;

        double stcg = longTerm ? 0 : gain * STCG_RATE;
        double taxableLtcg = longTerm ? Math.max(0, gain - LTCG_EXEMPTION) : 0;
        double ltcg = taxableLtcg * LTCG_RATE;
        double postTax = investedAmount + gain - stcg - ltcg;
        double postTaxReturn = investedAmount <= 0 ? 0 : ((postTax / investedAmount) - 1) * 100;

        String explanation = longTerm
                ? "Equity LTCG above ₹1.25 lakh is taxed at 12.5% for holdings over 1 year."
                : "Equity STCG is taxed at 20% for holdings under 1 year.";

        return new TaxReport(stcg, ltcg, 0, postTaxReturn, explanation);
    }
}
