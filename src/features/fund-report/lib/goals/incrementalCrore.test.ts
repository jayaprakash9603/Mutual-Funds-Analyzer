import { describe, expect, it } from 'vitest'
import { yearsForNextCrore } from './incrementalCrore'

describe('yearsForNextCrore', () => {
  it('takes about 6 years to grow from 1Cr to 2Cr at 12%', () => {
    expect(yearsForNextCrore(1, 12)).toBeCloseTo(6, 0)
  })

  it('takes about 3.5 years to grow from 2Cr to 3Cr at 12%', () => {
    expect(yearsForNextCrore(2, 12)).toBeCloseTo(3.6, 0)
  })
})
