import type { FundReportRisk } from '../../schemas'

type Volatility = FundReportRisk['volatility']

function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

function dailyPeriod(volatility: Volatility) {
  return volatility.periods.find((period) => period.frequency === 'Daily')
}

function weeklyPeriod(volatility: Volatility) {
  return volatility.periods.find((period) => period.frequency === 'Weekly')
}

function monthlyPeriod(volatility: Volatility) {
  return volatility.periods.find((period) => period.frequency === 'Monthly')
}

export function describeFluctuation(volatility: Volatility): string | null {
  const daily = dailyPeriod(volatility)
  if (!daily || daily.observations === 0) return null

  const positiveShare = daily.positivePeriodsPercent
  return `On a typical day this fund moves about ${pct(daily.typicalSwingPercent, 2)} in either direction. Roughly ${pct(positiveShare, 0)} of days finished positive.`
}

export function describeWorstMove(volatility: Volatility): string | null {
  const daily = dailyPeriod(volatility)
  const monthly = monthlyPeriod(volatility)
  if (!daily || daily.observations === 0) return null

  const parts = [
    `Its worst single day was ${pct(daily.worstReturnPercent, 1)} on ${daily.worstReturnDate}.`,
  ]
  if (monthly && monthly.observations > 0) {
    parts.push(
      `The worst month was ${pct(monthly.worstReturnPercent, 1)} ending ${monthly.worstReturnDate}.`,
    )
  }
  return parts.join(' ')
}

export function describeVsBenchmark(volatility: Volatility): string | null {
  if (!volatility.benchmarkAvailable) return null

  const daily = dailyPeriod(volatility)
  if (!daily || daily.observations === 0) return null

  const calmerShare = 100 - volatility.rollingSummary.timeAboveBenchmarkPercent
  if (volatility.rollingSummary.timeAboveBenchmarkPercent > 50) {
    return `It has been more volatile than its benchmark in ${pct(volatility.rollingSummary.timeAboveBenchmarkPercent, 0)} of rolling windows.`
  }
  return `It has been calmer than its index in ${pct(calmerShare, 0)} of rolling windows.`
}

export function describeTrend(volatility: Volatility): string | null {
  const summary = volatility.rollingSummary
  if (summary.averagePercent <= 0) return null

  const delta = summary.currentPercent - summary.averagePercent
  if (Math.abs(delta) < 0.5) {
    return `Current volatility is close to its long-run average of ${pct(summary.averagePercent, 1)}.`
  }
  if (delta > 0) {
    return `Volatility is running hot at ${pct(summary.currentPercent, 1)} versus a long-run average of ${pct(summary.averagePercent, 1)}.`
  }
  return `Volatility is below its long-run average of ${pct(summary.averagePercent, 1)} at ${pct(summary.currentPercent, 1)} today.`
}

export function getDailyPeriod(volatility: Volatility) {
  return dailyPeriod(volatility)
}

export function getWeeklyPeriod(volatility: Volatility) {
  return weeklyPeriod(volatility)
}

export function getMonthlyPeriod(volatility: Volatility) {
  return monthlyPeriod(volatility)
}
