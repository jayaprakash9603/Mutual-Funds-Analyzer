import { describe, expect, it } from 'vitest'
import {
  buildCycleChartModel,
  buildDeclineRecoveryCycles,
  buildIndexedNavTimelineModel,
  cycleHeadline,
} from './declineRecoveryCycles'

describe('declineRecoveryCycles', () => {
  const phases = [
    {
      type: 'DECLINE',
      startDate: '2020-02-01',
      endDate: '2020-03-24',
      changePercent: -31,
      durationLabel: '1Y 2M',
      durationYears: 1.17,
      ongoing: false,
    },
    {
      type: 'RECOVERY',
      startDate: '2020-03-24',
      endDate: '2020-11-13',
      changePercent: 46,
      durationLabel: '7M',
      durationYears: 0.58,
      ongoing: false,
    },
    {
      type: 'DECLINE',
      startDate: '2022-01-03',
      endDate: '2022-06-23',
      changePercent: -8,
      durationLabel: '5M',
      durationYears: 0.42,
      ongoing: false,
    },
    {
      type: 'RECOVERY',
      startDate: '2022-06-23',
      endDate: '2023-05-11',
      changePercent: 12,
      durationLabel: '10M',
      durationYears: 0.83,
      ongoing: false,
    },
  ]

  const indexedNav = [
    { date: '2020-02-01', indexValue: 100 },
    { date: '2020-02-15', indexValue: 95 },
    { date: '2020-03-01', indexValue: 82 },
    { date: '2020-03-24', indexValue: 69 },
    { date: '2020-05-01', indexValue: 78 },
    { date: '2020-08-01', indexValue: 92 },
    { date: '2020-11-13', indexValue: 101 },
    { date: '2022-01-03', indexValue: 130 },
    { date: '2022-06-23', indexValue: 120 },
    { date: '2023-05-11', indexValue: 134 },
  ]

  it('keeps only cycles with at least a 10% decline', () => {
    const cycles = buildDeclineRecoveryCycles(phases)
    expect(cycles).toHaveLength(1)
    expect(cycles[0]?.declinePercent).toBe(31)
    expect(cycles[0]?.recoveryPercent).toBe(46)
    expect(cycles[0]?.label).toBe('2020')
  })

  it('builds symmetric chart points around zero', () => {
    const cycles = buildDeclineRecoveryCycles(phases)
    const model = buildCycleChartModel(cycles)
    expect(model.points.some((point) => point.decline < 0)).toBe(true)
    expect(model.points.some((point) => point.recovery > 0)).toBe(true)
    expect(model.bands).toHaveLength(1)
  })

  it('uses real indexed NAV paths when available', () => {
    const cycles = buildDeclineRecoveryCycles(phases)
    const model = buildCycleChartModel(cycles, indexedNav)
    expect(model.usesRealNav).toBe(true)
    expect(model.points.length).toBeGreaterThan(6)
    expect(model.points.some((point) => point.value <= -30)).toBe(true)
    expect(model.points.some((point) => point.recovery > 0)).toBe(true)
  })

  it('builds indexed NAV timeline with decline and recovery segments', () => {
    const timeline = buildIndexedNavTimelineModel(indexedNav, phases)
    expect(timeline.points).toHaveLength(indexedNav.length)
    expect(timeline.points.some((point) => point.declineNav != null)).toBe(true)
    expect(timeline.points.some((point) => point.recoveryNav != null)).toBe(true)
    expect(timeline.bands).toHaveLength(1)
  })

  it('shows the upside headline when recoveries exceed declines', () => {
    expect(cycleHeadline(buildDeclineRecoveryCycles(phases))).toMatch(/Upsides are much higher/)
  })
})
