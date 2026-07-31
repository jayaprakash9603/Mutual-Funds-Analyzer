import { format } from 'date-fns'
import { parseNavDate } from '@/lib/utils'
import { alignRollingReturns, mean, stdDev } from './navSeries'
import type { AnalysisInput, RollingReturnRow } from './types'

export interface RollingReturnChartPoint {
  label: string
  shortLabel: string
  tooltipRange: string
  fund: number
  benchmark: number
}

export interface ReturnStats {
  average: number
  median: number
  maximum: number
  minimum: number
}

export interface ConsistencyBucket {
  label: string
  percentage: number
}

export interface RollingReturnTableRow {
  name: string
  category: string
  stats: ReturnStats
  consistency: ConsistencyBucket[]
}

const CONSISTENCY_BUCKETS = [
  { label: 'Less than 0%', min: -Infinity, max: 0 },
  { label: '0 - 8%', min: 0, max: 8 },
  { label: '8 - 12%', min: 8, max: 12 },
  { label: '12 - 15%', min: 12, max: 15 },
  { label: '15 - 20%', min: 15, max: 20 },
  { label: 'Greater than 20%', min: 20, max: Infinity },
] as const

function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function computeStats(values: number[]): ReturnStats {
  if (!values.length) {
    return { average: 0, median: 0, maximum: 0, minimum: 0 }
  }
  return {
    average: mean(values),
    median: median(values),
    maximum: Math.max(...values),
    minimum: Math.min(...values),
  }
}

function computeConsistency(values: number[]): ConsistencyBucket[] {
  if (!values.length) {
    return CONSISTENCY_BUCKETS.map((b) => ({ label: b.label, percentage: 0 }))
  }

  return CONSISTENCY_BUCKETS.map((bucket) => {
    const count = values.filter((v) =>
      bucket.max === Infinity ? v >= bucket.min : v >= bucket.min && v < bucket.max,
    ).length
    return {
      label: bucket.label,
      percentage: (count / values.length) * 100,
    }
  })
}

function formatRange(start: Date, end: Date) {
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}

function formatAxisLabel(start: Date, end: Date) {
  return `${format(start, 'MMM yyyy')} to ${format(end, 'MMM yyyy')}`
}

function formatShortAxisLabel(end: Date) {
  return format(end, 'MMM yyyy')
}

function buildChartPoints(fund: RollingReturnRow[], benchmarkReturns: Map<string, number>) {
  return fund
    .map((row) => {
      const start = parseNavDate(row.nav_date)
      const end = parseNavDate(row.scheme_forward_date)
      const bench = benchmarkReturns.get(start.toISOString().slice(0, 10))
      if (bench === undefined) return null

      return {
        label: formatAxisLabel(start, end),
        shortLabel: formatShortAxisLabel(end),
        tooltipRange: formatRange(start, end),
        fund: row.scheme_rolling_returns,
        benchmark: bench,
      }
    })
    .filter((p): p is RollingReturnChartPoint => p !== null)
}

export function getDetailedRollingReturnData(input: AnalysisInput) {
  const benchmarkMap = new Map(
    input.benchmark.map((row) => [
      parseNavDate(row.nav_date).toISOString().slice(0, 10),
      row.scheme_rolling_returns,
    ]),
  )

  const points = buildChartPoints(input.fund, benchmarkMap)
  const fundReturns = points.map((p) => p.fund)
  const benchReturns = points.map((p) => p.benchmark)

  const aligned = alignRollingReturns(input.fund, input.benchmark)

  const tableRows: RollingReturnTableRow[] = [
    {
      name: input.fund[0]?.scheme_name ?? 'Fund',
      category: input.fund[0]?.scheme_category ?? '',
      stats: computeStats(fundReturns),
      consistency: computeConsistency(fundReturns),
    },
    {
      name: input.benchmark[0]?.scheme_name ?? 'Benchmark',
      category: input.benchmark[0]?.scheme_category ?? '',
      stats: computeStats(benchReturns),
      consistency: computeConsistency(benchReturns),
    },
  ]

  return { points, tableRows, alignedCount: aligned.length }
}

export interface RollingDistributionBin {
  label: string
  binStart: number
  binEnd: number
  midpoint: number
  count: number
  percentOfWindows: number
}

export interface RollingReturnDistribution {
  bins: RollingDistributionBin[]
  stats: ReturnStats
  standardDeviation: number
  windowCount: number
  negativeCount: number
  negativePercent: number
  modalBin: RollingDistributionBin
}

const DEFAULT_DISTRIBUTION_BINS = 18

export function getRollingReturnDistribution(
  input: AnalysisInput,
  binCount = DEFAULT_DISTRIBUTION_BINS,
): RollingReturnDistribution | null {
  const returns = input.fund.map((row) => row.scheme_rolling_returns)
  if (returns.length === 0) return null

  const minimum = Math.min(...returns)
  const maximum = Math.max(...returns)
  const step = (maximum - minimum) / binCount || 1

  const bins: RollingDistributionBin[] = Array.from({ length: binCount }, (_, index) => {
    const binStart = minimum + index * step
    const binEnd = binStart + step
    return {
      label: `${binStart.toFixed(1)} to ${binEnd.toFixed(1)}`,
      binStart,
      binEnd,
      midpoint: (binStart + binEnd) / 2,
      count: 0,
      percentOfWindows: 0,
    }
  })

  for (const value of returns) {
    const index = Math.min(binCount - 1, Math.max(0, Math.floor((value - minimum) / step)))
    bins[index].count += 1
  }

  for (const bin of bins) {
    bin.percentOfWindows = (bin.count / returns.length) * 100
  }

  const negativeCount = returns.filter((value) => value < 0).length
  const modalBin = bins.reduce((peak, bin) => (bin.count > peak.count ? bin : peak), bins[0])

  return {
    bins,
    stats: computeStats(returns),
    standardDeviation: stdDev(returns),
    windowCount: returns.length,
    negativeCount,
    negativePercent: (negativeCount / returns.length) * 100,
    modalBin,
  }
}

export { CONSISTENCY_BUCKETS }
