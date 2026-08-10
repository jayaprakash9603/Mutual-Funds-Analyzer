import type { FundReportRisk } from '../../schemas'

type HeatmapCell = FundReportRisk['consistency']['monthlyHeatmap'][number]

export type HeatmapYearRow = {
  year: number
  partial?: boolean
}

export type MonthlyHeatmapGrid = {
  years: HeatmapYearRow[]
  monthByKey: Map<string, { year: number; month: number; returnPercent: number }>
  maxMonthlyAbs: number
}

export function buildMonthlyHeatmapGrid(cells: HeatmapCell[]): MonthlyHeatmapGrid {
  const monthByKey = new Map<string, { year: number; month: number; returnPercent: number }>()
  const yearSet = new Set<number>()
  let maxAbs = 10

  for (const cell of cells) {
    yearSet.add(cell.year)
    monthByKey.set(`${cell.year}-${cell.month}`, cell)
    maxAbs = Math.max(maxAbs, Math.abs(cell.returnPercent))
  }

  const years = [...yearSet]
    .sort((a, b) => a - b)
    .map((year) => ({ year }))

  return {
    years,
    monthByKey,
    maxMonthlyAbs: maxAbs,
  }
}
