import { describe, expect, it } from 'vitest'
import { snapToNearestSeriesDate } from '@/features/fund-report/lib/drawdown/snapSeriesDate'

describe('snapToNearestSeriesDate', () => {
  const seriesDates = ['2020-01-01', '2020-06-01', '2021-01-01']

  it('returns the exact date when present in the series', () => {
    expect(snapToNearestSeriesDate(seriesDates, '2020-06-01')).toBe('2020-06-01')
  })

  it('snaps to the nearest available date when the target is missing', () => {
    expect(snapToNearestSeriesDate(seriesDates, '2020-05-15')).toBe('2020-06-01')
    expect(snapToNearestSeriesDate(seriesDates, '2020-02-01')).toBe('2020-01-01')
  })

  it('returns the target date when the series is empty', () => {
    expect(snapToNearestSeriesDate([], '2020-05-15')).toBe('2020-05-15')
  })
})
