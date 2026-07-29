import { describe, expect, it } from 'vitest'
import { buildDoublingTimeSeries, yearsToDouble } from './doublingTime'

describe('yearsToDouble', () => {
  it('returns about 6.1 years at 12% CAGR', () => {
    expect(yearsToDouble(12)).toBeCloseTo(6.1, 1)
  })

  it('returns infinity for non-positive CAGR', () => {
    expect(yearsToDouble(0)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('buildDoublingTimeSeries', () => {
  it('covers 1% through 25% CAGR', () => {
    const series = buildDoublingTimeSeries()

    expect(series).toHaveLength(25)
    expect(series[0].cagrPercent).toBe(1)
    expect(series[24].cagrPercent).toBe(25)
    expect(series[11].yearsToDouble).toBeCloseTo(6.1, 1)
  })
})
