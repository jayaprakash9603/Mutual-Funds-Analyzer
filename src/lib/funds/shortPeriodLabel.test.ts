import { describe, expect, it } from 'vitest'
import { shortPeriodLabel } from './shortPeriodLabel'

describe('shortPeriodLabel', () => {
  it('keeps full labels when not compact', () => {
    expect(shortPeriodLabel('1 Month')).toBe('1 Month')
    expect(shortPeriodLabel('Since Launch', false)).toBe('Since Launch')
  })

  it('shortens common horizons on compact screens', () => {
    expect(shortPeriodLabel('1 Month', true)).toBe('1M')
    expect(shortPeriodLabel('3 Month', true)).toBe('3M')
    expect(shortPeriodLabel('10 Year', true)).toBe('10Y')
    expect(shortPeriodLabel('Since Launch', true)).toBe('Launch')
  })
})
