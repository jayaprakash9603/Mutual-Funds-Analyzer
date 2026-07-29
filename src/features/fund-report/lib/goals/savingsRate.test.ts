import { describe, expect, it } from 'vitest'
import { buildSavingsRateGrid, expenseMultiple } from './savingsRate'

describe('expenseMultiple', () => {
  it('reaches about 30x expenses with 30% savings over 25 years', () => {
    expect(expenseMultiple(30, 25, 5, 12)).toBeCloseTo(30, 0)
  })
})

describe('buildSavingsRateGrid', () => {
  it('builds a grid for 10-70% savings and 5-30 year horizons', () => {
    const grid = buildSavingsRateGrid()

    expect(grid.salaryGrowthPercent).toBe(5)
    expect(grid.equityCagrPercent).toBe(12)
    expect(grid.savingsRatesPercent[0]).toBe(10)
    expect(grid.savingsRatesPercent.at(-1)).toBe(70)
    expect(grid.horizonsYears[0]).toBe(5)
    expect(grid.horizonsYears.at(-1)).toBe(30)
    expect(grid.rows[2][20].expenseMultiple).toBeCloseTo(30, 0)
  })
})
