import { describe, expect, it } from 'vitest'
import {
  buildTargetAmountGrid,
  monthsToTarget,
  TARGET_AMOUNTS,
  TARGET_SIP_AMOUNTS,
} from './targetAmountPlanner'

describe('monthsToTarget', () => {
  it('reaches 1Cr from 10k SIP at 12% with no step-up in about 20Y1M', () => {
    const months = monthsToTarget(10_000, 1_00_00_000, 12, 0)

    expect(months).toBe(241)
  })

  it('reaches 1Cr from 10k SIP at 12% with 5% step-up in about 17Y10M', () => {
    const months = monthsToTarget(10_000, 1_00_00_000, 12, 5)

    expect(months).toBe(214)
  })
})

describe('buildTargetAmountGrid', () => {
  it('builds a grid for configured SIP and target amounts', () => {
    const grid = buildTargetAmountGrid(12, 0)

    expect(grid.sipAmounts).toEqual(TARGET_SIP_AMOUNTS)
    expect(grid.targetAmounts).toEqual(TARGET_AMOUNTS)
    expect(grid.cagrPercent).toBe(12)
    expect(grid.stepUpPercent).toBe(0)
    expect(grid.rows).toHaveLength(TARGET_SIP_AMOUNTS.length)
    expect(grid.rows[0]).toHaveLength(TARGET_AMOUNTS.length)
    expect(grid.rows[1][1].duration).toBe('20Y1M')
  })
})
