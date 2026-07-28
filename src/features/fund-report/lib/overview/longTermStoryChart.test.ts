import { describe, expect, it } from 'vitest'
import {
  buildLongTermStoryChartPoints,
  buildLongTermStorySeries,
  computeLongTermStoryStats,
  formatStoryMonthYear,
  shortCategoryHeadline,
} from './longTermStoryChart'

describe('longTermStoryChart', () => {
  const points = [
    { date: '2013-05-28', indexValue: 100 },
    { date: '2018-05-28', indexValue: 200 },
    { date: '2026-07-27', indexValue: 840 },
  ]

  it('computes cagr and multiple', () => {
    const stats = computeLongTermStoryStats(
      points,
      'Equity Scheme - Flexi Cap Fund',
      13.2,
    )
    expect(stats).not.toBeNull()
    expect(stats!.moneyMultiple).toBeCloseTo(8.4, 1)
    expect(stats!.cagrPercent).toBeGreaterThan(0)
    expect(stats!.categoryHeadline).toBe('Flexi Cap Fund')
  })

  it('builds chart points with nav fallback', () => {
    const series = buildLongTermStoryChartPoints(
      [
        { date: '2013-05-28', indexValue: 100 },
        { date: '2026-07-27', indexValue: 840, nav: 84.5 },
      ],
      84.5,
    )
    expect(series[0]!.nav).toBeCloseTo(10.06, 1)
    expect(series.at(-1)!.nav).toBeCloseTo(84.5, 2)
  })

  it('builds linear trend series', () => {
    const series = buildLongTermStorySeries(points)
    expect(series[0]!.trendValue).toBeCloseTo(100, 5)
    expect(series.at(-1)!.trendValue).toBeCloseTo(840, 5)
  })

  it('formats month-year labels', () => {
    expect(formatStoryMonthYear('2013-05-28')).toBe('May-13')
  })

  it('shortens category headline', () => {
    expect(shortCategoryHeadline('Equity Scheme - Flexi Cap Fund')).toBe('Flexi Cap Fund')
  })
})
