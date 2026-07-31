import { describe, expect, it } from 'vitest'
import { buildPerformanceTimelineAnalysis } from './performanceTimelineAnalysis'
import type { RollingReturnRow } from '@/api/schemas'

function row(
  navDate: string,
  forwardDate: string,
  rolling: number,
  nav = 100,
  forwardNav = 110,
): RollingReturnRow {
  return {
    id: 1,
    scheme_category: 'Equity',
    scheme_name: 'Test Fund',
    nav_date: navDate,
    scheme_nav: nav,
    scheme_forward_date: forwardDate,
    scheme_forward_nav: forwardNav,
    scheme_rolling_returns: rolling,
  }
}

describe('buildPerformanceTimelineAnalysis', () => {
  const fund = [
    row('Jan 1, 2020', 'Jan 1, 2025', 10, 100, 160),
    row('Jan 2, 2020', 'Jan 2, 2025', 12, 101, 162),
    row('Jan 3, 2020', 'Jan 3, 2025', 8, 102, 158),
    row('Jan 4, 2020', 'Jan 4, 2025', 15, 103, 165),
    row('Jan 5, 2020', 'Jan 5, 2025', 11, 104, 161),
  ]

  const benchmark = [
    row('Jan 1, 2020', 'Jan 1, 2025', 9),
    row('Jan 2, 2020', 'Jan 2, 2025', 10),
    row('Jan 3, 2020', 'Jan 3, 2025', 9),
    row('Jan 4, 2020', 'Jan 4, 2025', 11),
    row('Jan 5, 2020', 'Jan 5, 2025', 10),
  ]

  it('builds five chronological milestones with alpha and summary stats', () => {
    const analysis = buildPerformanceTimelineAnalysis(
      { fund, benchmark, period: '5 Year' },
      null,
      [],
    )

    expect(analysis).not.toBeNull()
    expect(analysis!.milestones).toHaveLength(5)
    expect(analysis!.milestones.map((m) => m.kind)).toEqual([
      'inception',
      'worst',
      'mid',
      'best',
      'latest',
    ])

    const worst = analysis!.milestones.find((m) => m.kind === 'worst')
    expect(worst?.fundReturn).toBe(8)
    expect(worst?.alpha).toBe(-1)

    const best = analysis!.milestones.find((m) => m.kind === 'best')
    expect(best?.fundReturn).toBe(15)
    expect(best?.alpha).toBe(4)

    expect(analysis!.summary.windowCount).toBe(5)
    expect(analysis!.summary.fundBest).toBe(15)
    expect(analysis!.summary.fundWorst).toBe(8)
    expect(analysis!.summary.spread).toBe(7)
    expect(analysis!.summary.beatBenchmarkPct).toBe(80)
    expect(analysis!.chartPoints.some((point) => point.milestone === 'best')).toBe(true)
  })

  it('returns null when no aligned windows exist', () => {
    const analysis = buildPerformanceTimelineAnalysis(
      { fund, benchmark: [], period: '5 Year' },
      null,
      [],
    )
    expect(analysis).toBeNull()
  })
})
