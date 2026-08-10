import type { MatrixReport } from '../../schemas'

export type EntryTimingPoint = {
  startLabel: string
  value: number
}

export type EntryTimingFan = {
  holdingYears: number
  points: EntryTimingPoint[]
  min: number
  p25: number
  median: number
  p75: number
  max: number
  /** ₹10,000 grown at median CAGR over holdingYears. */
  medianCorpusOf10k: number
  worstCorpusOf10k: number
  bestCorpusOf10k: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]!
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]!
  const weight = index - lower
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight
}

function corpusFromCagr(cagrPercent: number, years: number, principal = 10_000): number {
  return principal * Math.pow(1 + cagrPercent / 100, years)
}

export function availableEntryTimingHorizons(matrix: MatrixReport): number[] {
  const max = Math.max(0, ...matrix.holdingYears)
  return [5, 10, 15].filter((years) => years <= max && matrix.holdingYears.includes(years))
}

export function buildEntryTimingFan(
  matrix: MatrixReport,
  holdingYears: number,
): EntryTimingFan | null {
  const points: EntryTimingPoint[] = []
  for (const row of matrix.dataRows) {
    const cell = row.cells.find((c) => c.holdingYears === holdingYears)
    if (cell?.value == null || !Number.isFinite(cell.value)) continue
    points.push({ startLabel: row.startLabel, value: cell.value })
  }

  if (points.length === 0) return null

  const sorted = [...points.map((p) => p.value)].sort((a, b) => a - b)
  const min = sorted[0]!
  const max = sorted[sorted.length - 1]!
  const median = percentile(sorted, 0.5)
  const p25 = percentile(sorted, 0.25)
  const p75 = percentile(sorted, 0.75)

  return {
    holdingYears,
    points,
    min,
    p25,
    median,
    p75,
    max,
    medianCorpusOf10k: corpusFromCagr(median, holdingYears),
    worstCorpusOf10k: corpusFromCagr(min, holdingYears),
    bestCorpusOf10k: corpusFromCagr(max, holdingYears),
  }
}
