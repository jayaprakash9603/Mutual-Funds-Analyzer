import { describe, expect, it } from 'vitest'
import { buildStepUpMilestones } from './stepUpMilestones'

describe('buildStepUpMilestones', () => {
  it('splits the final corpus into 10 cumulative bands', () => {
    const milestones = buildStepUpMilestones(10_000, 10, 12, 20)

    expect(milestones.bands).toHaveLength(10)
    expect(milestones.finalCorpus).toBeGreaterThan(0)
    expect(milestones.totalReturns).toBeCloseTo(
      milestones.finalCorpus - milestones.totalInvested,
      2,
    )

    const totalInvestment = milestones.bands.reduce((sum, band) => sum + band.investment, 0)
    const totalReturns = milestones.bands.reduce((sum, band) => sum + band.returns, 0)

    expect(totalInvestment).toBeCloseTo(milestones.totalInvested, 2)
    expect(totalReturns).toBeCloseTo(milestones.totalReturns, 2)
    expect(milestones.bands[0].corpusSharePercent).toBe(10)
    expect(milestones.bands.at(-1)?.corpusEnd).toBeCloseTo(milestones.finalCorpus, 2)
  })

  it('reaches later bands faster with more return contribution', () => {
    const milestones = buildStepUpMilestones(10_000, 10, 12, 20)

    expect(milestones.bands[0].months).toBeGreaterThan(milestones.bands[9].months)
    expect(milestones.bands[9].returns).toBeGreaterThan(milestones.bands[0].returns)
  })
})
