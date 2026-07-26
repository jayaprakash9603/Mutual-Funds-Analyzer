import { describe, expect, it } from 'vitest'
import {
  buildAnnualStressHeadline,
  computeAnnualStressStats,
} from './annualStressAnalysis'

describe('annualStressAnalysis', () => {
  const sample = [
    { year: 2020, returnPercent: 16, intraYearDrawdown: -38 },
    { year: 2021, returnPercent: 24, intraYearDrawdown: -12 },
    { year: 2022, returnPercent: -8, intraYearDrawdown: -18 },
  ]

  it('computes summary rates', () => {
    const stats = computeAnnualStressStats(sample)
    expect(stats.totalYears).toBe(3)
    expect(stats.yearsWithTenPlusDrawdown).toBe(3)
    expect(stats.positiveYears).toBe(2)
    expect(stats.positiveYearRate).toBeCloseTo(66.67, 1)
    expect(stats.averageDrawdown).toBeCloseTo(22.67, 1)
  })

  it('builds a readable headline', () => {
    const stats = computeAnnualStressStats(sample)
    const headline = buildAnnualStressHeadline(stats, 'Test Fund')
    expect(headline).toContain('Test Fund')
    expect(headline).toContain('2 out of 3')
  })
})
