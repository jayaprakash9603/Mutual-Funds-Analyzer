import { format } from 'date-fns'
import { parseNavDate } from '@/lib/utils'
import { alignRollingReturns, mean } from './navSeries'
import type { AnalysisInput, RollingReturnRow } from './types'

export interface RollingReturnChartPoint {
  label: string
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

function buildChartPoints(fund: RollingReturnRow[], benchmarkReturns: Map<string, number>) {
  return fund
    .map((row) => {
      const start = parseNavDate(row.nav_date)
      const end = parseNavDate(row.scheme_forward_date)
      const bench = benchmarkReturns.get(start.toISOString().slice(0, 10))
      if (bench === undefined) return null

      return {
        label: formatAxisLabel(start, end),
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

export { CONSISTENCY_BUCKETS }
