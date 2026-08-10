import type { FundReportPerformance } from '../../schemas'

type Period = FundReportPerformance['rollingReturns']['periods'][number]

export type PatienceRow = {
  periodLabel: string
  years: number
  min: number
  median: number
  max: number
  lossProbability: number
  /** Stacked area base (min clamped so band renders above zero axis when needed). */
  bandBase: number
  /** Stacked area height = max - min. */
  bandSpan: number
}

function parseYears(periodLabel: string): number | null {
  const match = periodLabel.match(/(\d+)/)
  if (!match) return null
  const years = Number(match[1])
  return Number.isFinite(years) ? years : null
}

export function buildPatienceRows(periods: Period[]): PatienceRow[] {
  return periods
    .map((period) => {
      const years = parseYears(period.periodLabel)
      if (years == null) return null
      const min = period.minimum
      const max = period.maximum
      return {
        periodLabel: period.periodLabel,
        years,
        min,
        median: period.median,
        max,
        lossProbability: period.percentNegative,
        bandBase: min,
        bandSpan: Math.max(0, max - min),
      } satisfies PatienceRow
    })
    .filter((row): row is PatienceRow => row != null)
    .sort((a, b) => a.years - b.years)
}

/** First horizon where loss probability is near zero (≤ 1%), else the longest horizon. */
export function patienceHeadline(rows: PatienceRow[]): string | null {
  if (rows.length === 0) return null
  const safe = rows.find((row) => row.lossProbability <= 1)
  const target = safe ?? rows[rows.length - 1]!
  return `By year ${target.years}, the chance of a loss drops to ${target.lossProbability.toFixed(1)}%.`
}
