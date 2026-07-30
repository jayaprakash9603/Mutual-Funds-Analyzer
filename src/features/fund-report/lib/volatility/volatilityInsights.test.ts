import { describe, expect, it } from 'vitest'
import {
  describeFluctuation,
  describeTrend,
  describeVsBenchmark,
  describeWorstMove,
} from './volatilityInsights'
import type { FundReportRisk } from '../../schemas'

const sampleVolatility: FundReportRisk['volatility'] = {
  periodLabel: 'Jan 2015 to Jan 2026',
  benchmarkAvailable: true,
  periods: [
    {
      frequency: 'Daily',
      observations: 2500,
      stdDevPercent: 1.2,
      annualisedVolatilityPercent: 18.5,
      averageReturnPercent: 0.05,
      typicalSwingPercent: 0.85,
      bestReturnPercent: 8.2,
      bestReturnDate: '4 Jun 2020',
      worstReturnPercent: -9.5,
      worstReturnDate: '23 Mar 2020',
      positivePeriodsPercent: 54,
      negativePeriodsPercent: 46,
      benchmarkAnnualisedVolatilityPercent: 16.2,
      benchmarkBestReturnPercent: 7.1,
      benchmarkWorstReturnPercent: -8.4,
    },
    {
      frequency: 'Monthly',
      observations: 120,
      stdDevPercent: 4.5,
      annualisedVolatilityPercent: 15.6,
      averageReturnPercent: 1.1,
      typicalSwingPercent: 3.2,
      bestReturnPercent: 12.4,
      bestReturnDate: '30 Apr 2020',
      worstReturnPercent: -18.2,
      worstReturnDate: '31 Mar 2020',
      positivePeriodsPercent: 62,
      negativePeriodsPercent: 38,
      benchmarkAnnualisedVolatilityPercent: 14.1,
      benchmarkBestReturnPercent: 10.2,
      benchmarkWorstReturnPercent: -16.5,
    },
  ],
  rollingSeries: [],
  rollingSummary: {
    windowDays: 252,
    currentPercent: 20,
    averagePercent: 17,
    maxPercent: 35,
    maxDate: '23 Mar 2020',
    minPercent: 10,
    minDate: '1 Jan 2018',
    benchmarkAveragePercent: 16,
    timeAboveBenchmarkPercent: 42,
  },
  dailyDistribution: [],
  volatilityBand: 'High',
  headline: 'High risk with 18.5% annualised volatility',
}

describe('volatilityInsights', () => {
  it('describes typical daily fluctuation', () => {
    expect(describeFluctuation(sampleVolatility)).toContain('0.85%')
  })

  it('describes worst moves across daily and monthly horizons', () => {
    const text = describeWorstMove(sampleVolatility)
    expect(text).toContain('23 Mar 2020')
    expect(text).toContain('31 Mar 2020')
  })

  it('describes benchmark comparison when available', () => {
    expect(describeVsBenchmark(sampleVolatility)).toContain('calmer')
  })

  it('describes trend relative to long-run average', () => {
    expect(describeTrend(sampleVolatility)).toContain('running hot')
  })
})
