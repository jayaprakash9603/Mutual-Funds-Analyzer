export type SavingsRateCell = {
  savingsRatePercent: number
  horizonYears: number
  expenseMultiple: number
}

export type SavingsRateGrid = {
  savingsRatesPercent: readonly number[]
  horizonsYears: readonly number[]
  salaryGrowthPercent: number
  equityCagrPercent: number
  rows: SavingsRateCell[][]
}

const SAVINGS_RATES_PERCENT = Array.from({ length: 7 }, (_, index) => (index + 1) * 10)
const HORIZONS_YEARS = Array.from({ length: 26 }, (_, index) => index + 5)

export function expenseMultiple(
  savingsRatePercent: number,
  horizonYears: number,
  salaryGrowthPercent: number,
  equityCagrPercent: number,
): number {
  const monthlyEquityRate = equityCagrPercent / 100 / 12
  let annualSalary = 1
  let monthlySalary = annualSalary / 12
  let corpus = 0

  for (let month = 1; month <= horizonYears * 12; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) {
      annualSalary *= 1 + salaryGrowthPercent / 100
      monthlySalary = annualSalary / 12
    }

    const contribution = monthlySalary * (savingsRatePercent / 100)
    corpus = (corpus + contribution) * (1 + monthlyEquityRate)
  }

  const finalAnnualExpenses = annualSalary * (1 - savingsRatePercent / 100)
  if (finalAnnualExpenses <= 0) {
    return 0
  }

  return corpus / finalAnnualExpenses
}

export function buildSavingsRateGrid(
  salaryGrowthPercent = 5,
  equityCagrPercent = 12,
): SavingsRateGrid {
  const rows = SAVINGS_RATES_PERCENT.map((savingsRatePercent) =>
    HORIZONS_YEARS.map((horizonYears) => ({
      savingsRatePercent,
      horizonYears,
      expenseMultiple: expenseMultiple(
        savingsRatePercent,
        horizonYears,
        salaryGrowthPercent,
        equityCagrPercent,
      ),
    })),
  )

  return {
    savingsRatesPercent: SAVINGS_RATES_PERCENT,
    horizonsYears: HORIZONS_YEARS,
    salaryGrowthPercent,
    equityCagrPercent,
    rows,
  }
}
