import type { FundReportPerformance } from '../../schemas'

export const MULTIPLY_TARGETS = [2, 3, 4, 5] as const

export type MultiplyOddsReport = FundReportPerformance['multiplyOdds']

export type MultiplyProbabilityRow = {
  multiply: number
  cells: Array<{
    holdingYears: number
    percent: number | null
    sampleCount?: number
    hitCount?: number
  }>
  highlightYears: [number, number] | null
  calloutPercent: number | null
}

export type MultiplyProbabilityTable = {
  periodLabel: string
  holdingYears: number[]
  rows: MultiplyProbabilityRow[]
  headline: string
}

export function fromMultiplyOdds(report: MultiplyOddsReport): MultiplyProbabilityTable {
  const holdingYears = report.holdingYears.filter((y) => y >= 5 && y <= 15)
  const rows: MultiplyProbabilityRow[] = report.rows.map((row) => ({
    multiply: row.multiply,
    cells: row.cells
      .filter((cell) => holdingYears.includes(cell.holdingYears))
      .map((cell) => ({
        holdingYears: cell.holdingYears,
        percent: cell.percent,
        sampleCount: cell.sampleCount,
        hitCount: cell.hitCount,
      })),
    highlightYears:
      row.highlightYears && row.highlightYears.length >= 2
        ? [row.highlightYears[0]!, row.highlightYears[1]!]
        : null,
    calloutPercent: row.calloutPercent ?? null,
  }))

  return {
    periodLabel: report.periodLabel,
    holdingYears,
    rows,
    headline: report.headline || 'Historical probability of reaching target multiples by holding period',
  }
}

export function isCellHighlighted(
  row: MultiplyProbabilityRow,
  holdingYears: number,
): boolean {
  if (!row.highlightYears) return false
  return holdingYears === row.highlightYears[0] || holdingYears === row.highlightYears[1]
}
