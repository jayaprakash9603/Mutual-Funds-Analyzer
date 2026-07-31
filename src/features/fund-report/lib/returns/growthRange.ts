import { format, parseISO } from 'date-fns'
import { downsample } from '@/lib/utils'
import { MAX_CHART_POINTS } from '@/lib/constants'

export type GrowthRangeId = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '7Y' | '10Y' | 'MAX'

export type GrowthRange = {
  id: GrowthRangeId
  label: string
  /** Months of history the range covers; null means the full series. */
  months: number | null
}

export const GROWTH_RANGES: readonly GrowthRange[] = [
  { id: '1M', label: '1M', months: 1 },
  { id: '3M', label: '3M', months: 3 },
  { id: '6M', label: '6M', months: 6 },
  { id: '1Y', label: '1Y', months: 12 },
  { id: '3Y', label: '3Y', months: 36 },
  { id: '5Y', label: '5Y', months: 60 },
  { id: '7Y', label: '7Y', months: 84 },
  { id: '10Y', label: '10Y', months: 120 },
  { id: 'MAX', label: 'Max', months: null },
] as const

export const DEFAULT_GROWTH_RANGE: GrowthRangeId = '1Y'

export type IndexedNavInput = {
  date: string
  indexValue: number
  nav?: number
}

export type GrowthTrendPoint = {
  date: string
  label: string
  indexValue: number
  nav?: number
  changePercent: number
}

export type GrowthTrendSeries = {
  range: GrowthRangeId
  points: GrowthTrendPoint[]
  startDate: string
  endDate: string
  /** Total return across the window, in percent. */
  changePercent: number
  /** Annualised return; null for windows shorter than a year where CAGR is misleading. */
  cagrPercent: number | null
  years: number
  startNav?: number
  endNav?: number
  /** What ₹10,000 invested at the start of the window would be worth at the end. */
  valueOf10k: number
  peakChangePercent: number
  troughChangePercent: number
}

const MONTHS_PER_YEAR = 12
const DAYS_PER_YEAR = 365.25
const MILLIS_PER_DAY = 1000 * 60 * 60 * 24
const BASE_INDEX = 100
const REFERENCE_INVESTMENT = 10_000
/** Below this many points a range has too little data to plot a meaningful line. */
const MIN_POINTS = 2
/**
 * A "1Y" window ends up a fraction under 365.25 days because the cutoff lands on a
 * trading day, so annualising needs a small tolerance or 1Y would never qualify.
 */
const ANNUALISE_MIN_YEARS = 0.99

function parseDate(value: string): Date {
  return parseISO(value.slice(0, 10))
}

function labelFor(date: Date, spanMonths: number): string {
  if (spanMonths <= 6) return format(date, 'd MMM')
  if (spanMonths <= 24) return format(date, 'MMM yyyy')
  return format(date, 'MMM yyyy')
}

function cutoffFor(lastDate: Date, months: number): Date {
  const cutoff = new Date(lastDate)
  cutoff.setMonth(cutoff.getMonth() - months)
  return cutoff
}

function seriesSpanMonths(points: readonly IndexedNavInput[]): number {
  const first = parseDate(points[0]!.date)
  const last = parseDate(points[points.length - 1]!.date)
  return ((last.getTime() - first.getTime()) / MILLIS_PER_DAY / DAYS_PER_YEAR) * MONTHS_PER_YEAR
}

function coversRange(points: readonly IndexedNavInput[], months: number | null): boolean {
  return months === null || months <= seriesSpanMonths(points)
}

/**
 * Ranges the series can actually cover. A fund with three years of NAV history
 * should not offer a 10Y button that renders an identical chart to Max.
 */
export function availableGrowthRanges(points: readonly IndexedNavInput[]): Set<GrowthRangeId> {
  const available = new Set<GrowthRangeId>()
  if (points.length < MIN_POINTS) return available

  for (const range of GROWTH_RANGES) {
    if (coversRange(points, range.months)) {
      available.add(range.id)
    }
  }
  return available
}

/** Longest range the series supports, so a stale selection can fall back instead of blanking. */
export function longestAvailableRange(points: readonly IndexedNavInput[]): GrowthRangeId | null {
  const available = availableGrowthRanges(points)
  for (let index = GROWTH_RANGES.length - 1; index >= 0; index--) {
    const range = GROWTH_RANGES[index]!
    if (available.has(range.id)) return range.id
  }
  return null
}

export function buildGrowthTrend(
  points: readonly IndexedNavInput[],
  range: GrowthRangeId,
): GrowthTrendSeries | null {
  if (points.length < MIN_POINTS) return null

  const definition = GROWTH_RANGES.find((option) => option.id === range) ?? GROWTH_RANGES[GROWTH_RANGES.length - 1]!
  if (!coversRange(points, definition.months)) return null

  const lastDate = parseDate(points[points.length - 1]!.date)
  const window =
    definition.months === null
      ? [...points]
      : points.filter((point) => parseDate(point.date) >= cutoffFor(lastDate, definition.months!))

  if (window.length < MIN_POINTS) return null

  const base = window[0]!.indexValue
  if (base <= 0) return null

  const spanMonths = definition.months ?? Number.MAX_SAFE_INTEGER
  const rebased: GrowthTrendPoint[] = window.map((point) => {
    const indexValue = (point.indexValue / base) * BASE_INDEX
    return {
      date: point.date.slice(0, 10),
      label: labelFor(parseDate(point.date), spanMonths),
      indexValue,
      nav: point.nav,
      changePercent: indexValue - BASE_INDEX,
    }
  })

  const first = rebased[0]!
  const last = rebased[rebased.length - 1]!
  const years =
    (parseDate(last.date).getTime() - parseDate(first.date).getTime()) / MILLIS_PER_DAY / DAYS_PER_YEAR
  const growthMultiple = last.indexValue / BASE_INDEX

  return {
    range: definition.id,
    points: downsample(rebased, MAX_CHART_POINTS),
    startDate: first.date,
    endDate: last.date,
    changePercent: last.changePercent,
    cagrPercent:
      years >= ANNUALISE_MIN_YEARS ? (growthMultiple ** (1 / years) - 1) * BASE_INDEX : null,
    years,
    startNav: first.nav,
    endNav: last.nav,
    valueOf10k: REFERENCE_INVESTMENT * growthMultiple,
    peakChangePercent: Math.max(...rebased.map((point) => point.changePercent)),
    troughChangePercent: Math.min(...rebased.map((point) => point.changePercent)),
  }
}
