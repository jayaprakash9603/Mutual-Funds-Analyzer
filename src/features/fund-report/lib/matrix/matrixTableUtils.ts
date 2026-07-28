import { bandColor, bandTextColor } from '@/lib/charts/chartColors'
import type { MatrixReport } from '../../schemas'

export type MatrixDataRow = MatrixReport['dataRows'][number]

export function isMultipleMatrixMode(mode: string): boolean {
  return mode === 'MULTIPLE' || mode.endsWith('_MULTIPLE')
}

export function formatMatrixValue(mode: string, value: number) {
  if (isMultipleMatrixMode(mode)) return `${value.toFixed(1)}x`
  return `${value.toFixed(0)}%`
}

export function computeColumnMinimums(rows: MatrixDataRow[], columnCount: number) {
  const mins: (number | null)[] = Array.from({ length: columnCount }, () => null)

  for (let c = 0; c < columnCount; c++) {
    let min: number | null = null
    for (const row of rows) {
      const value = row.cells[c]?.value
      if (value == null) continue
      if (min == null || value < min) min = value
    }
    mins[c] = min
  }

  return mins
}

export function isColumnMinimum(value: number | null | undefined, columnMin: number | null) {
  if (value == null || columnMin == null) return false
  return Math.abs(value - columnMin) < 0.05
}

export function cellFillStyle(band: string | null | undefined, columnMin: boolean) {
  if (columnMin) {
    return { backgroundColor: '#f97316', color: '#1c1917' }
  }
  if (!band) {
    return { backgroundColor: '#ffffff', color: '#0f172a' }
  }
  return {
    backgroundColor: bandColor(band),
    color: bandTextColor(band),
  }
}

export function buildSubsetSummaryRows(
  rows: MatrixDataRow[],
  holdingYears: number[],
  mode: string,
): MatrixReport['summaryRows'] {
  const labels = ['Average', 'Max', 'Min'] as const

  return labels.map((label) => ({
    label,
    values: holdingYears.map((_, columnIndex) => {
      const values = rows
        .map((row) => row.cells[columnIndex]?.value)
        .filter((value): value is number => value != null)

      if (values.length === 0) return null

      if (label === 'Average') {
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length
        return isMultipleMatrixMode(mode) ? avg : Math.round(avg)
      }
      if (label === 'Max') {
        const max = Math.max(...values)
        return isMultipleMatrixMode(mode) ? max : Math.round(max)
      }
      const min = Math.min(...values)
      return isMultipleMatrixMode(mode) ? min : Math.round(min)
    }),
  }))
}

export function findContiguousLabelRanges(labels: string[], orderedLabels: string[]) {
  if (labels.length === 0) return [] as Array<{ start: number; end: number }>

  const indexByLabel = new Map(orderedLabels.map((label, index) => [label, index]))
  const indices = labels
    .map((label) => indexByLabel.get(label))
    .filter((index): index is number => index != null)
    .sort((a, b) => a - b)

  if (indices.length === 0) return []

  const ranges: Array<{ start: number; end: number }> = []
  let start = indices[0]
  let prev = indices[0]

  for (let i = 1; i < indices.length; i++) {
    const current = indices[i]
    if (current === prev + 1) {
      prev = current
      continue
    }
    ranges.push({ start, end: prev })
    start = current
    prev = current
  }
  ranges.push({ start, end: prev })
  return ranges
}

export function filterMatrixRows(data: MatrixReport, startLabels: Set<string>): MatrixReport {
  const dataRows = data.dataRows.filter((row) => startLabels.has(row.startLabel))
  return trimMatrixToCalculatedValues({
    ...data,
    startLabels: dataRows.map((row) => row.startLabel),
    summaryRows: buildSubsetSummaryRows(dataRows, data.holdingYears, data.mode),
    dataRows,
  })
}

/** Drop rows and holding-period columns that contain no calculated values. */
export function trimMatrixToCalculatedValues(data: MatrixReport): MatrixReport {
  if (data.dataRows.length === 0 || data.holdingYears.length === 0) {
    return data
  }

  const columnCount = data.holdingYears.length
  const columnHasValue = Array.from({ length: columnCount }, () => false)

  for (const row of data.dataRows) {
    row.cells.forEach((cell, index) => {
      if (cell.value != null) {
        columnHasValue[index] = true
      }
    })
  }

  const activeColumnIndices = columnHasValue
    .map((hasValue, index) => (hasValue ? index : -1))
    .filter((index) => index >= 0)

  if (activeColumnIndices.length === 0) {
    return {
      ...data,
      startLabels: [],
      holdingYears: [],
      summaryRows: [],
      dataRows: [],
    }
  }

  const dataRows = data.dataRows
    .map((row) => ({
      startLabel: row.startLabel,
      cells: activeColumnIndices.map((index) => row.cells[index]),
    }))
    .filter((row) => row.cells.some((cell) => cell.value != null))

  const holdingYears = activeColumnIndices.map((index) => data.holdingYears[index])

  return {
    ...data,
    startLabels: dataRows.map((row) => row.startLabel),
    holdingYears,
    summaryRows: buildSubsetSummaryRows(dataRows, holdingYears, data.mode),
    dataRows,
  }
}
