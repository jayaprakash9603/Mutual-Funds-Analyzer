import { describe, expect, it } from 'vitest'
import { buildRequiredCagrGrid, requiredCagr } from './requiredCagr'

describe('requiredCagr', () => {
  it('returns about 11.6% for a 3x multiple over 10 years', () => {
    expect(requiredCagr(3, 10)).toBeCloseTo(11.6, 1)
  })
})

describe('buildRequiredCagrGrid', () => {
  it('builds a 2x-20x by 2Y-20Y grid', () => {
    const grid = buildRequiredCagrGrid()

    expect(grid.multiples[0]).toBe(2)
    expect(grid.multiples.at(-1)).toBe(20)
    expect(grid.horizonsYears[0]).toBe(2)
    expect(grid.horizonsYears.at(-1)).toBe(20)
    expect(grid.rows).toHaveLength(19)
    expect(grid.rows[0]).toHaveLength(19)
    expect(grid.rows[1][8].cagrPercent).toBeCloseTo(11.6, 1)
  })
})
