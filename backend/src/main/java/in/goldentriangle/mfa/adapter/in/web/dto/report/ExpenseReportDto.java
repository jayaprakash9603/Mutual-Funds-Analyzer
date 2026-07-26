package in.goldentriangle.mfa.adapter.in.web.dto.report;

public record ExpenseReportDto(
        Double expenseRatio,
        Double costOver10Years,
        Double costOver20Years,
        Double categoryAverageExpense,
        String explanation) {
}
