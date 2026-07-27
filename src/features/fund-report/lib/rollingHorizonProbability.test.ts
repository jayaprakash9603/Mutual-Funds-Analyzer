import { describe, expect, it } from 'vitest'
import {
  buildHorizonProbabilityRows,
  NEAR_ZERO_NEGATIVE_THRESHOLD,
  nearZeroTailSpan,
} from './rollingHorizonProbability'

const samplePeriods = [
  {
    periodLabel: '1 Year',
    average: 12,
    maximum: 40,
    minimum: -8,
    median: 11,
    stdDev: 6,
    count: 100,
    percentAbove10: 63,
    percentAbove7: 79,
    percentNegative: 36,
  },
  {
    periodLabel: '5 Year',
    average: 14,
    maximum: 22,
    minimum: 8,
    median: 13,
    stdDev: 3,
    count: 80,
    percentAbove10: 87,
    percentAbove7: 95,
    percentNegative: 0.1,
  },
  {
    periodLabel: '10 Year',
    average: 13,
    maximum: 16,
    minimum: 10,
    median: 13,
    stdDev: 2,
    count: 40,
    percentAbove10: 99,
    percentAbove7: 99,
    percentNegative: 0,
  },
]

describe('buildHorizonProbabilityRows', () => {
  it('drops horizons without rolling windows', () => {
    const rows = buildHorizonProbabilityRows(samplePeriods, 'percentNegative')
    expect(rows.map((row) => row.periodLabel)).toEqual(['1 Year', '5 Year', '10 Year'])
  })

  it('marks near-zero negative horizons for tail highlighting', () => {
    const rows = buildHorizonProbabilityRows(samplePeriods, 'percentNegative', {
      markNearZero: true,
      nearZeroThreshold: NEAR_ZERO_NEGATIVE_THRESHOLD,
    })

    expect(rows.map((row) => row.periodLabel)).toEqual(['1 Year', '5 Year', '10 Year'])
    expect(rows.find((row) => row.periodLabel === '1 Year')?.isNearZero).toBe(false)
    expect(rows.find((row) => row.periodLabel === '5 Year')?.isNearZero).toBe(true)
    expect(rows.find((row) => row.periodLabel === '10 Year')?.isNearZero).toBe(true)

    expect(nearZeroTailSpan(rows)).toEqual({ start: 1, end: 2 })
  })

  it('highlights the seven-year horizon for positive thresholds', () => {
    const periods = [
      ...samplePeriods,
      {
        periodLabel: '7 Year',
        average: 13,
        maximum: 18,
        minimum: 9,
        median: 13,
        stdDev: 2,
        count: 55,
        percentAbove10: 98,
        percentAbove7: 98,
        percentNegative: 0,
      },
    ]

    const rows = buildHorizonProbabilityRows(periods, 'percentAbove7', {
      highlightPeriod: '7 Year',
    })

    expect(rows.find((row) => row.periodLabel === '7 Year')?.highlight).toBe(true)
  })
})
