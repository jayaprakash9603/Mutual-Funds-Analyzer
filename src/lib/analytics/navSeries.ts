import { parseNavDate, dateKey } from '@/lib/utils'
import type { NavPoint, RollingReturnRow } from './types'

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24
const MAX_NAV_GAP_DAYS = 7

export function buildNavSeries(rows: RollingReturnRow[]): NavPoint[] {
  const navMap = new Map<string, number>()

  for (const row of rows) {
    navMap.set(dateKey(parseNavDate(row.nav_date)), row.scheme_nav)
    navMap.set(dateKey(parseNavDate(row.scheme_forward_date)), row.scheme_forward_nav)
  }

  return Array.from(navMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, nav]) => ({ date: new Date(key), nav }))
}

export function getCommonNavSeries(fundNav: NavPoint[], benchmarkNav: NavPoint[]) {
  const benchmarkMap = new Map(benchmarkNav.map((p) => [dateKey(p.date), p.nav]))
  const common: { date: Date; fundNav: number; benchmarkNav: number }[] = []

  for (const point of fundNav) {
    const bench = benchmarkMap.get(dateKey(point.date))
    if (bench !== undefined) {
      common.push({ date: point.date, fundNav: point.nav, benchmarkNav: bench })
    }
  }

  return common
}

export function computeDailyReturns(series: NavPoint[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1]
    const curr = series[i]
    const days = (curr.date.getTime() - prev.date.getTime()) / MILLIS_PER_DAY
    if (days > 0 && days <= MAX_NAV_GAP_DAYS) {
      returns.push(curr.nav / prev.nav - 1)
    }
  }
  return returns
}

export function alignRollingReturns(fund: RollingReturnRow[], benchmark: RollingReturnRow[]) {
  const benchmarkMap = new Map(
    benchmark.map((row) => [dateKey(parseNavDate(row.nav_date)), row.scheme_rolling_returns]),
  )

  return fund
    .map((row) => {
      const key = dateKey(parseNavDate(row.nav_date))
      const benchmarkReturn = benchmarkMap.get(key)
      if (benchmarkReturn === undefined) return null
      return {
        date: parseNavDate(row.nav_date),
        fundReturn: row.scheme_rolling_returns,
        benchmarkReturn,
      }
    })
    .filter((point): point is NonNullable<typeof point> => point !== null)
}

export function mean(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function stdDev(values: number[]) {
  if (values.length < 2) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}
