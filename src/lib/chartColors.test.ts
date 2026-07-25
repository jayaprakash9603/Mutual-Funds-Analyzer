import { describe, expect, it } from 'vitest'
import { bandColor, bandTextColor, RETURN_BAND_COLORS, RETURN_BAND_TEXT } from '@/lib/chartColors'

describe('chartColors', () => {
  it('maps return bands to colors', () => {
    expect(bandColor('STRONG')).toBe(RETURN_BAND_COLORS.STRONG)
    expect(bandColor('WEAK')).toBe(RETURN_BAND_COLORS.WEAK)
    expect(bandColor('NEGATIVE')).toBe(RETURN_BAND_COLORS.NEGATIVE)
    expect(bandColor(null)).toBe('transparent')
  })

  it('uses dark text on weak and moderate bands for contrast', () => {
    expect(bandTextColor('WEAK')).toBe(RETURN_BAND_TEXT.WEAK)
    expect(bandTextColor('MODERATE')).toBe(RETURN_BAND_TEXT.MODERATE)
    expect(bandTextColor('STRONG')).toBe(RETURN_BAND_TEXT.STRONG)
    expect(bandTextColor('NEGATIVE')).toBe(RETURN_BAND_TEXT.NEGATIVE)
  })
})
