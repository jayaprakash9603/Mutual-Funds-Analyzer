package in.goldentriangle.mfa.domain.model.report;

public record ExpenseReport(
        Double expenseRatio,
        Double costOver10Years,
        Double costOver20Years,
        Double categoryAverageExpense,
        String explanation) {
}
