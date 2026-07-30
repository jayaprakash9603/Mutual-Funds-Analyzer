import { describe, expect, it } from 'vitest'
import {
  buildBenchmarkHeadline,
  buildIntraYearDeclineHeadline,
  buildRollingReturnsHeadline,
  buildVolatilityHeadline,
  shortFundName,
} from '@/features/fund-report/lib/headlines/sectionHeadlines'
import type { HeadlinePart } from '@/features/fund-report/lib/headlines/types'
import type { FundReportPerformance, FundReportRisk } from '@/features/fund-report/schemas'

function flatten(parts: HeadlinePart[]): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.text)).join('')
}

function accentText(parts: HeadlinePart[]): string[] {
  return parts
    .filter((part): part is Exclude<HeadlinePart, string> => typeof part !== 'string')
    .filter((part) => part.tone === 'accent')
    .map((part) => part.text)
}

function rollingPeriod(
  periodLabel: string,
  overrides: Partial<FundReportPerformance['rollingReturns']['periods'][number]> = {},
) {
  return {
    periodLabel,
    average: 15,
    maximum: 30,
    minimum: 5,
    median: 15,
    stdDev: 3,
    count: 100,
    percentAbove10: 85,
    percentAbove7: 95,
    percentNegative: 0,
    ...overrides,
  }
}

describe('shortFundName', () => {
  it('drops the plan and option suffix', () => {
    expect(shortFundName('Parag Parikh Flexi Cap Fund - Regular Plan - Growth')).toBe(
      'Parag Parikh Flexi Cap Fund',
    )
  })

  it('leaves a name without a suffix untouched', () => {
    expect(shortFundName('HDFC Flexi Cap Fund')).toBe('HDFC Flexi Cap Fund')
  })

  it('keeps hyphenated words that are not separators', () => {
    expect(shortFundName('Mirae Asset Large-Cap Fund')).toBe('Mirae Asset Large-Cap Fund')
  })
})

describe('buildRollingReturnsHeadline', () => {
  it('anchors on the 7-year horizon when it has data', () => {
    const headline = buildRollingReturnsHeadline(
      {
        periods: [
          rollingPeriod('1 Year', { percentAbove10: 60, percentNegative: 20, minimum: -22 }),
          rollingPeriod('7 Year', { percentAbove10: 98, minimum: 14 }),
          rollingPeriod('10 Year', { percentAbove10: 100, minimum: 16 }),
        ],
        consistencyScore: 90,
      },
      'Demo Fund - Direct - Growth',
    )

    expect(headline).not.toBeNull()
    expect(flatten(headline!.parts)).toBe(
      '98% of the times Demo Fund gave more than 10% returns over 7 years',
    )
    expect(accentText(headline!.parts)).toEqual([
      '98% of the times',
      'more than 10% returns',
      '7 years',
    ])
  })

  it('highlighter-marks only the leading statistic', () => {
    const headline = buildRollingReturnsHeadline(
      { periods: [rollingPeriod('7 Year', { percentAbove10: 98 })], consistencyScore: 90 },
      'Demo Fund',
    )
    const marked = headline!.parts.filter((part) => typeof part !== 'string' && part.mark)

    expect(marked).toEqual([{ text: '98% of the times', tone: 'accent', mark: true }])
  })

  it('falls back to the longest horizon that has windows', () => {
    const headline = buildRollingReturnsHeadline(
      {
        periods: [
          rollingPeriod('5 Year', { percentAbove10: 96 }),
          rollingPeriod('15 Year', { count: 0 }),
        ],
        consistencyScore: 80,
      },
      'Demo Fund',
    )

    expect(flatten(headline!.parts)).toContain('over 5 years')
  })

  it('calls out a clean record when no window ended negative', () => {
    const headline = buildRollingReturnsHeadline(
      { periods: [rollingPeriod('7 Year', { percentNegative: 0, minimum: 5.2 })], consistencyScore: 90 },
      'Demo Fund',
    )

    expect(headline!.note).toBe('No instance of negative returns over 7 years — the lowest was 5.2%!')
    expect(headline!.noteTone).toBe('accent')
  })

  it('reports the negative share when some windows lost money', () => {
    const headline = buildRollingReturnsHeadline(
      { periods: [rollingPeriod('7 Year', { percentNegative: 2.5, minimum: -3.4 })], consistencyScore: 70 },
      'Demo Fund',
    )

    expect(headline!.note).toBe(
      'Only 2.5% of 7 years windows ended negative, and the lowest was -3.4%.',
    )
  })

  it('returns null when no horizon has windows', () => {
    expect(
      buildRollingReturnsHeadline(
        { periods: [rollingPeriod('7 Year', { count: 0 })], consistencyScore: 0 },
        'Demo Fund',
      ),
    ).toBeNull()
  })
})

describe('buildBenchmarkHeadline', () => {
  const comparison = {
    fundTotalReturn: 420,
    benchmarkTotalReturn: 210,
    difference: 210,
    outperformed: true,
    outperformancePercent: 100,
    winningPercent: 86,
    explanation: '',
  }

  it('names the benchmark when one was resolved', () => {
    const headline = buildBenchmarkHeadline(comparison, 'Demo Fund', 'NIFTY 500 TRI')

    expect(flatten(headline!.parts)).toBe(
      'Demo Fund beat NIFTY 500 TRI in 86% of rolling windows, by 210.0% in total return',
    )
  })

  it('reads naturally when the benchmark name is a placeholder', () => {
    for (const name of ['Benchmark unavailable', 'Benchmark', '   ']) {
      expect(flatten(buildBenchmarkHeadline(comparison, 'Demo Fund', name)!.parts)).toContain(
        'Demo Fund beat its benchmark in',
      )
    }
  })

  it('returns null when there is nothing to compare', () => {
    expect(
      buildBenchmarkHeadline(
        { ...comparison, fundTotalReturn: 0, benchmarkTotalReturn: 0 },
        'Demo Fund',
        'NIFTY 500 TRI',
      ),
    ).toBeNull()
  })
})

describe('buildIntraYearDeclineHeadline', () => {
  function consistency(
    calendarYears: FundReportRisk['consistency']['calendarYears'],
  ): FundReportRisk['consistency'] {
    return {
      calendarYears,
      monthlyHeatmap: [],
      worstYear: -7.4,
      bestYear: 45.3,
      worstMonth: -12,
      bestMonth: 14,
      longestWinningStreak: 5,
      longestLosingStreak: 1,
      consistencyRating: 'Excellent',
    }
  }

  it('pairs a typical decline band with the count of positive years', () => {
    const headline = buildIntraYearDeclineHeadline(
      consistency([
        { year: 2020, returnPercent: 32, intraYearDrawdown: -28 },
        { year: 2021, returnPercent: 45, intraYearDrawdown: -11 },
        { year: 2022, returnPercent: -3, intraYearDrawdown: -17 },
        { year: 2023, returnPercent: 37, intraYearDrawdown: -9 },
      ]),
      'Demo Fund - Direct - Growth',
    )

    expect(flatten(headline!.parts)).toBe(
      'Demo Fund saw 10-20% temporary declines in a typical year — yet 3 of 4 years still ended with positive returns',
    )
  })

  it('returns null when there is barely any calendar history', () => {
    expect(
      buildIntraYearDeclineHeadline(
        consistency([{ year: 2024, returnPercent: 10, intraYearDrawdown: -5 }]),
        'Demo Fund',
      ),
    ).toBeNull()
  })
})

describe('buildVolatilityHeadline', () => {
  it('highlights annualised volatility and typical daily swing', () => {
    const headline = buildVolatilityHeadline(
      {
        periodLabel: '',
        benchmarkAvailable: false,
        periods: [
          {
            frequency: 'Daily',
            observations: 100,
            stdDevPercent: 1,
            annualisedVolatilityPercent: 18.5,
            averageReturnPercent: 0.1,
            typicalSwingPercent: 0.8,
            bestReturnPercent: 5,
            bestReturnDate: '1 Jan 2020',
            worstReturnPercent: -6,
            worstReturnDate: '23 Mar 2020',
            positivePeriodsPercent: 55,
            negativePeriodsPercent: 45,
            benchmarkAnnualisedVolatilityPercent: 0,
            benchmarkBestReturnPercent: 0,
            benchmarkWorstReturnPercent: 0,
          },
        ],
        rollingSeries: [],
        rollingSummary: {
          windowDays: 252,
          currentPercent: 0,
          averagePercent: 0,
          maxPercent: 0,
          maxDate: '',
          minPercent: 0,
          minDate: '',
          benchmarkAveragePercent: 0,
          timeAboveBenchmarkPercent: 0,
        },
        dailyDistribution: [],
        volatilityBand: 'High',
        headline: '',
      },
      'Demo Fund - Direct - Growth',
    )

    expect(flatten(headline!.parts)).toContain('18.5%')
    expect(accentText(headline!.parts)).toContain('0.80%')
  })
})
