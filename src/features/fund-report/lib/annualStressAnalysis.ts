import type { FundReport } from '../schemas'

export type CalendarYearRow = FundReport['consistency']['calendarYears'][number]

export type AnnualStressStats = {
  totalYears: number
  yearsWithTenPlusDrawdown: number
  positiveYears: number
  averageDrawdown: number
  positiveYearRate: number
  tenPlusDrawdownRate: number
}

export function computeAnnualStressStats(years: CalendarYearRow[]): AnnualStressStats {
  if (years.length === 0) {
    return {
      totalYears: 0,
      yearsWithTenPlusDrawdown: 0,
      positiveYears: 0,
      averageDrawdown: 0,
      positiveYearRate: 0,
      tenPlusDrawdownRate: 0,
    }
  }

  const yearsWithTenPlusDrawdown = years.filter((row) => Math.abs(row.intraYearDrawdown) >= 10).length
  const positiveYears = years.filter((row) => row.returnPercent > 0).length
  const averageDrawdown =
    years.reduce((sum, row) => sum + Math.abs(row.intraYearDrawdown), 0) / years.length

  return {
    totalYears: years.length,
    yearsWithTenPlusDrawdown,
    positiveYears,
    averageDrawdown,
    positiveYearRate: (positiveYears / years.length) * 100,
    tenPlusDrawdownRate: (yearsWithTenPlusDrawdown / years.length) * 100,
  }
}

export function buildAnnualStressHeadline(stats: AnnualStressStats, fundName: string) {
  if (stats.totalYears === 0) {
    return `Not enough calendar-year history to summarize drawdowns for ${fundName}.`
  }

  const drawdownPhrase =
    stats.tenPlusDrawdownRate >= 50
      ? '10–20% (or deeper) temporary declines in many years'
      : 'temporary intra-year declines in several years'

  return `${fundName} witnessed ${drawdownPhrase} — yet ${stats.positiveYears} out of ${stats.totalYears} calendar years (${stats.positiveYearRate.toFixed(0)}%) still ended with positive returns.`
}
