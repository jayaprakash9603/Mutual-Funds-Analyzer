import { describe, expect, it } from 'vitest'
import { bandColor, RETURN_BAND_COLORS } from '@/lib/chartColors'

describe('chartColors', () => {
  it('maps return bands to colors', () => {
    expect(bandColor('STRONG')).toBe(RETURN_BAND_COLORS.STRONG)
    expect(bandColor('NEGATIVE')).toBe(RETURN_BAND_COLORS.NEGATIVE)
    expect(bandColor(null)).toBe('transparent')
  })
})
