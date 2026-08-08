import { describe, expect, it } from 'vitest'
import { shortSchemeLabel } from './shortSchemeLabel'

describe('shortSchemeLabel', () => {
  it('returns the full name when not compact', () => {
    const full = 'Aditya Birla Sun Life Flexi Cap Fund - Growth - Direct Plan'
    expect(shortSchemeLabel(full, false)).toBe(full)
  })

  it('abbreviates AMC and plan on compact screens', () => {
    expect(
      shortSchemeLabel('Aditya Birla Sun Life Flexi Cap Fund - Growth - Direct Plan', true),
    ).toBe('ABSL Flexi Cap (Dir)')
    expect(
      shortSchemeLabel('Parag Parikh Flexi Cap Fund - Regular Plan - Growth', true),
    ).toBe('Parag Parikh Flexi Cap (Reg)')
  })
})
