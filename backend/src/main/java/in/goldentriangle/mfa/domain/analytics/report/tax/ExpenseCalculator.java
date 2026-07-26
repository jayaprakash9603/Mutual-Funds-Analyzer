package in.goldentriangle.mfa.domain.analytics.report.tax;

import in.goldentriangle.mfa.domain.model.report.investment.ExpenseReport;

import java.util.Optional;

public class ExpenseCalculator {

    public ExpenseReport compute(Optional<Double> expenseRatio, double investedAmount, double cagrPercent) {
        if (expenseRatio.isEmpty()) {
            return new ExpenseReport(
                    null,
                    null,
                    null,
                    null,
                    "Expense ratio data is not available for this fund yet.");
        }
        double ratio = expenseRatio.get() / 100;
        double cost10 = investedAmount * ratio * 10;
        double cost20 = investedAmount * ratio * 20;
        return new ExpenseReport(
                expenseRatio.get(),
                cost10,
                cost20,
                null,
                "Higher expense ratios reduce net returns over long holding periods.");
    }
}
