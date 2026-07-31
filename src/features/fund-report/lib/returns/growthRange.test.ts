import { describe, expect, it } from 'vitest'
import {
  availableGrowthRanges,
  buildGrowthTrend,
  type IndexedNavInput,
} from './growthRange'

/** Daily series from 2020-01-01 that compounds steadily, so growth is easy to reason about. */
function series(days: number, dailyGrowth = 0.001): IndexedNavInput[] {
  const points: IndexedNavInput[] = []
  let index = 100
  const start = new Date('2020-01-01T00:00:00Z')
  for (let day = 0; day < days; day++) {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + day)
    points.push({
      date: date.toISOString().slice(0, 10),
      indexValue: index,
      nav: index / 10,
    })
    index *= 1 + dailyGrowth
  }
  return points
}

describe('availableGrowthRanges', () => {
  it('only offers ranges the history can cover', () => {
    const available = availableGrowthRanges(series(400))

    expect(available.has('1M')).toBe(true)
    expect(available.has('6M')).toBe(true)
    expect(available.has('1Y')).toBe(true)
    expect(available.has('3Y')).toBe(false)
    expect(available.has('10Y')).toBe(false)
    expect(available.has('MAX')).toBe(true)
  })

  it('returns nothing for an empty or single-point series', () => {
    expect(availableGrowthRanges([]).size).toBe(0)
    expect(availableGrowthRanges(series(1)).size).toBe(0)
  })
})

describe('buildGrowthTrend', () => {
  it('rebases the selected window to 100 and reports growth from there', () => {
    const trend = buildGrowthTrend(series(800), '6M')

    expect(trend).not.toBeNull()
    expect(trend!.points[0].indexValue).toBeCloseTo(100)
    expect(trend!.points[0].changePercent).toBeCloseTo(0)
    expect(trend!.changePercent).toBeGreaterThan(0)
    expect(trend!.valueOf10k).toBeCloseTo(10_000 * (1 + trend!.changePercent / 100), 4)
  })

  it('windows shorter than a year report no annualised figure', () => {
    expect(buildGrowthTrend(series(800), '3M')!.cagrPercent).toBeNull()
    expect(buildGrowthTrend(series(800), '1Y')!.cagrPercent).not.toBeNull()
  })

  it('a shorter window covers fewer calendar days than a longer one', () => {
    const short = buildGrowthTrend(series(800), '1M')!
    const long = buildGrowthTrend(series(800), '1Y')!

    expect(short.years).toBeLessThan(long.years)
    expect(short.changePercent).toBeLessThan(long.changePercent)
  })

  it('max spans the whole series', () => {
    const points = series(800)
    const max = buildGrowthTrend(points, 'MAX')!

    expect(max.startDate).toBe(points[0].date)
    expect(max.endDate).toBe(points[points.length - 1].date)
  })

  it('tracks the weakest point for a series that falls then recovers', () => {
    const falling: IndexedNavInput[] = [
      { date: '2024-01-01', indexValue: 100 },
      { date: '2024-02-01', indexValue: 80 },
      { date: '2024-03-01', indexValue: 105 },
    ]
    const trend = buildGrowthTrend(falling, 'MAX')!

    expect(trend.troughChangePercent).toBeCloseTo(-20)
    expect(trend.peakChangePercent).toBeCloseTo(5)
    expect(trend.changePercent).toBeCloseTo(5)
  })

  it('returns null when the window has too few points', () => {
    expect(buildGrowthTrend([], 'MAX')).toBeNull()
    expect(buildGrowthTrend(series(400), '10Y')).toBeNull()
  })
})
