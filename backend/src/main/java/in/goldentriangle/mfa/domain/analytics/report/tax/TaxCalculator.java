package in.goldentriangle.mfa.domain.analytics.report.tax;

import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;

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
        return computeFromSplitGains(
                longTerm ? 0 : gain,
                longTerm ? gain : 0,
                investedAmount);
    }

    /**
     * Taxes short- and long-term gains separately, which is what a SIP needs: every instalment is
     * its own lot, so a redemption today mixes units held for years with units bought last month.
     */
    public TaxReport computeFromSplitGains(double shortTermGain, double longTermGain, double investedAmount) {
        double stcg = Math.max(0, shortTermGain) * STCG_RATE;
        double ltcg = Math.max(0, Math.max(0, longTermGain) - LTCG_EXEMPTION) * LTCG_RATE;
        double gain = shortTermGain + longTermGain;
        double postTax = investedAmount + gain - stcg - ltcg;
        double postTaxReturn = investedAmount <= 0 ? 0 : ((postTax / investedAmount) - 1) * 100;

        String explanation = stcg > 0 && ltcg > 0
                ? "Units held over 1 year are taxed at 12.5% above ₹1.25 lakh; newer units at 20%."
                : stcg > 0
                        ? "Equity STCG is taxed at 20% for holdings under 1 year."
                        : "Equity LTCG above ₹1.25 lakh is taxed at 12.5% for holdings over 1 year.";

        return new TaxReport(stcg, ltcg, 0, postTaxReturn, explanation);
    }
}
