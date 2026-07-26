import type { MatrixReport } from '../schemas'

export const MULTIPLY_TARGETS = [2, 3, 4, 5] as const

export type MultiplyProbabilityRow = {
  multiply: number
  cells: Array<{ holdingYears: number; percent: number | null }>
  highlightYears: [number, number] | null
  calloutPercent: number | null
}

export type MultiplyProbabilityTable = {
  holdingYears: number[]
  rows: MultiplyProbabilityRow[]
  headline: string
}

export function buildMultiplyProbability(
  matrix: MatrixReport,
  benchmarkName?: string,
): MultiplyProbabilityTable {
  const holdingYears = matrix.holdingYears.filter((y) => y >= 5 && y <= 15)
  const rows: MultiplyProbabilityRow[] = MULTIPLY_TARGETS.map((multiply) => {
    const cells = holdingYears.map((h) => ({
      holdingYears: h,
      percent: percentAchievingMultiply(matrix, h, multiply),
    }))
    const highlightYears = findBestAdjacentPair(cells)
    const calloutPercent =
      highlightYears == null
        ? null
        : averagePair(
            cells.find((c) => c.holdingYears === highlightYears[0])?.percent,
            cells.find((c) => c.holdingYears === highlightYears[1])?.percent,
          )
    return { multiply, cells, highlightYears, calloutPercent }
  })

  const headlineRow = rows.find((r) => r.multiply === 3 && r.calloutPercent != null) ?? rows[1]
  const headline =
    headlineRow?.highlightYears && headlineRow.calloutPercent != null
      ? `${Math.round(headlineRow.calloutPercent)}% of the times ${
          benchmarkName ? 'this fund' : 'investments'
        } tripled in ${headlineRow.highlightYears[0]}-${headlineRow.highlightYears[1]} years`
      : 'Historical probability of reaching target multiples by holding period'

  return { holdingYears, rows, headline }
}

function percentAchievingMultiply(matrix: MatrixReport, holdingYears: number, multiply: number) {
  const values = matrix.dataRows
    .map((row) => row.cells.find((c) => c.holdingYears === holdingYears)?.value)
    .filter((v): v is number => v != null)
  if (values.length === 0) return null
  const hits = values.filter((v) => v >= multiply).length
  return (hits / values.length) * 100
}

function findBestAdjacentPair(cells: Array<{ holdingYears: number; percent: number | null }>) {
  let best: { pair: [number, number]; avg: number } | null = null
  for (let i = 0; i < cells.length - 1; i++) {
    const a = cells[i]?.percent
    const b = cells[i + 1]?.percent
    if (a == null || b == null) continue
    const avg = (a + b) / 2
    if (!best || avg > best.avg) {
      best = { pair: [cells[i].holdingYears, cells[i + 1].holdingYears], avg }
    }
  }
  return best?.pair ?? null
}

function averagePair(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null) return null
  return (a + b) / 2
}

export function isCellHighlighted(
  row: MultiplyProbabilityRow,
  holdingYears: number,
): boolean {
  if (!row.highlightYears) return false
  return holdingYears === row.highlightYears[0] || holdingYears === row.highlightYears[1]
}
