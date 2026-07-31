import { describe, expect, it } from 'vitest'
import { getRollingReturnDistribution } from './rollingReturnsAnalysis'
import type { RollingReturnRow } from '@/api/schemas'

function row(rolling: number): RollingReturnRow {
  return {
    id: 1,
    scheme_category: 'Equity',
    scheme_name: 'Test Fund',
    nav_date: 'Jan 1, 2020',
    scheme_nav: 100,
    scheme_forward_date: 'Jan 1, 2025',
    scheme_forward_nav: 160,
    scheme_rolling_returns: rolling,
  }
}

describe('getRollingReturnDistribution', () => {
  it('bins every window and reports share, spread, and the modal band', () => {
    const fund = [-4, -1, 2, 5, 5, 6, 9, 12].map(row)
    const distribution = getRollingReturnDistribution({ fund, benchmark: [], period: '5 Year' }, 4)

    expect(distribution).not.toBeNull()
    expect(distribution!.windowCount).toBe(8)
    expect(distribution!.bins).toHaveLength(4)
    expect(distribution!.bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(8)

    expect(distribution!.stats.minimum).toBe(-4)
    expect(distribution!.stats.maximum).toBe(12)
    expect(distribution!.negativeCount).toBe(2)
    expect(distribution!.negativePercent).toBe(25)

    const totalShare = distribution!.bins.reduce((sum, bin) => sum + bin.percentOfWindows, 0)
    expect(totalShare).toBeCloseTo(100)

    expect(distribution!.modalBin.count).toBe(
      Math.max(...distribution!.bins.map((bin) => bin.count)),
    )
  })

  it('places the maximum value in the final bin rather than overflowing', () => {
    const fund = [0, 10].map(row)
    const distribution = getRollingReturnDistribution({ fund, benchmark: [], period: '5 Year' }, 2)

    expect(distribution!.bins[1].count).toBe(1)
    expect(distribution!.bins[0].count).toBe(1)
  })

  it('returns null when there are no rolling windows', () => {
    expect(getRollingReturnDistribution({ fund: [], benchmark: [], period: '5 Year' })).toBeNull()
  })
})
