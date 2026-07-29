import { describe, expect, it } from 'vitest'
import { fromMultiplyOdds } from '@/features/fund-report/lib/matrix/multiplyProbability'
import type { FundReportPerformance } from '@/features/fund-report/schemas'

describe('fromMultiplyOdds', () => {
  it('maps backend multiply odds into the table shape', () => {
    const report: FundReportPerformance['multiplyOdds'] = {
      periodLabel: 'since inception Jun-13',
      holdingYears: [5, 6, 7],
      rows: [
        {
          multiply: 2,
          cells: [
            { holdingYears: 5, percent: 50, sampleCount: 100, hitCount: 50 },
            { holdingYears: 6, percent: 100, sampleCount: 95, hitCount: 95 },
            { holdingYears: 7, percent: 80, sampleCount: 90, hitCount: 72 },
          ],
          highlightYears: [6, 7],
          calloutPercent: 100,
        },
      ],
      headline: 'Multiply odds headline',
    }

    const table = fromMultiplyOdds(report)
    const doubleAt6 = table.rows.find((r) => r.multiply === 2)?.cells.find((c) => c.holdingYears === 6)

    expect(table.periodLabel).toBe('since inception Jun-13')
    expect(doubleAt6?.percent).toBe(100)
    expect(doubleAt6?.sampleCount).toBe(95)
    expect(doubleAt6?.hitCount).toBe(95)
    expect(table.holdingYears).toEqual([5, 6, 7])
    expect(table.headline).toBe('Multiply odds headline')
  })

  it('filters horizons outside the 5-15 year display range', () => {
    const table = fromMultiplyOdds({
      periodLabel: '',
      holdingYears: [3, 5, 16],
      rows: [
        {
          multiply: 2,
          cells: [
            { holdingYears: 3, percent: 10, sampleCount: 10, hitCount: 1 },
            { holdingYears: 5, percent: 20, sampleCount: 10, hitCount: 2 },
            { holdingYears: 16, percent: 30, sampleCount: 10, hitCount: 3 },
          ],
          highlightYears: null,
          calloutPercent: null,
        },
      ],
      headline: '',
    })

    expect(table.holdingYears).toEqual([5])
    expect(table.rows[0]?.cells.map((cell) => cell.holdingYears)).toEqual([5])
  })
})
