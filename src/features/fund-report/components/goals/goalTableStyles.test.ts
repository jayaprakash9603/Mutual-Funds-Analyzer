import { describe, expect, it } from 'vitest'
import {
  cagrHeatmapClasses,
  probabilityHeatmapClasses,
} from '@/features/fund-report/components/goals/goalTableStyles'

describe('cagrHeatmapClasses', () => {
  it('maps low CAGR to achievable tones', () => {
    expect(cagrHeatmapClasses(6)).toContain('emerald')
  })

  it('maps high CAGR to extreme tones', () => {
    expect(cagrHeatmapClasses(41.4)).toContain('red')
  })

  it('includes dark mode text classes', () => {
    expect(cagrHeatmapClasses(10)).toContain('dark:')
  })
})

describe('probabilityHeatmapClasses', () => {
  it('handles null values', () => {
    expect(probabilityHeatmapClasses(null)).toContain('muted')
  })

  it('maps high probability to emerald', () => {
    expect(probabilityHeatmapClasses(92)).toContain('emerald')
  })
})
