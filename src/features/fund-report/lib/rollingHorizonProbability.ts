import { MATRIX_PERIODS } from '@/lib/constants'
import type { FundReportPerformance } from '../schemas'

type RollingPeriod = FundReportPerformance['rollingReturns']['periods'][number]

export type HorizonProbabilityMetric = 'percentNegative' | 'percentAbove7' | 'percentAbove10'

export type HorizonProbabilityRow = {
  periodLabel: string
  shortLabel: string
  value: number
  count: number
  isNearZero: boolean
  highlight: boolean
}

export const NEAR_ZERO_NEGATIVE_THRESHOLD = 1
export const HIGHLIGHT_HORIZON_LABEL = '7 Year'

function shortHorizonLabel(label: string) {
  return label.replace(' Year', 'Y')
}

function yearsFromLabel(label: string) {
  const match = label.match(/^(\d+)/)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

export function buildHorizonProbabilityRows(
  periods: RollingPeriod[],
  metric: HorizonProbabilityMetric,
  options?: {
    nearZeroThreshold?: number
    /** Marks horizons at or below the threshold (used for the negative-returns tail highlight). */
    markNearZero?: boolean
    highlightPeriod?: string
  },
): HorizonProbabilityRow[] {
  const byLabel = new Map(periods.map((period) => [period.periodLabel, period]))
  const nearZeroThreshold = options?.nearZeroThreshold ?? NEAR_ZERO_NEGATIVE_THRESHOLD
  const markNearZero = options?.markNearZero ?? false
  const highlightPeriod = options?.highlightPeriod

  return MATRIX_PERIODS.flatMap((periodLabel) => {
    const period = byLabel.get(periodLabel)
    if (!period || period.count <= 0) {
      return []
    }

    const value = period[metric]
    const isNearZero = markNearZero && value <= nearZeroThreshold

    return [
      {
        periodLabel,
        shortLabel: shortHorizonLabel(periodLabel),
        value,
        count: period.count,
        isNearZero,
        highlight: highlightPeriod === periodLabel,
      },
    ]
  }).sort((left, right) => yearsFromLabel(left.periodLabel) - yearsFromLabel(right.periodLabel))
}

/** Contiguous near-zero tail from the first qualifying horizon through the end. */
export function nearZeroTailSpan(rows: HorizonProbabilityRow[]) {
  const first = rows.findIndex((row) => row.isNearZero)
  if (first < 0) {
    return null
  }

  let last = first
  while (last + 1 < rows.length && rows[last + 1]?.isNearZero) {
    last += 1
  }

  return { start: first, end: last }
}

export function formatHorizonProbability(value: number) {
  if (value > 0 && value < 1) {
    return `${value.toFixed(1)}%`
  }
  return `${Math.round(value)}%`
}
