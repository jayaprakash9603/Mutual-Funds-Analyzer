import { describe, expect, it } from 'vitest'
import { buildMultiplyProbability } from '@/features/fund-report/lib/multiplyProbability'
import type { MatrixReport } from '@/features/fund-report/schemas'

describe('buildMultiplyProbability', () => {
  it('computes percent of starts reaching each multiply target', () => {
    const matrix: MatrixReport = {
      mode: 'MULTIPLE',
      startLabels: ['Jan-10', 'Jan-11'],
      holdingYears: [5, 6, 7],
      summaryRows: [],
      dataRows: [
        {
          startLabel: 'Jan-10',
          cells: [
            { holdingYears: 5, value: 1.8, band: null },
            { holdingYears: 6, value: 2.2, band: 'STRONG' },
            { holdingYears: 7, value: 3.1, band: 'STRONG' },
          ],
        },
        {
          startLabel: 'Jan-11',
          cells: [
            { holdingYears: 5, value: 2.5, band: 'STRONG' },
            { holdingYears: 6, value: 2.8, band: 'STRONG' },
            { holdingYears: 7, value: 2.9, band: 'STRONG' },
          ],
        },
      ],
    }

    const table = buildMultiplyProbability(matrix)
    const doubleAt6 = table.rows.find((r) => r.multiply === 2)?.cells.find((c) => c.holdingYears === 6)

    expect(doubleAt6?.percent).toBe(100)
    expect(table.holdingYears).toEqual([5, 6, 7])
  })
})
