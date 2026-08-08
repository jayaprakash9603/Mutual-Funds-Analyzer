import { describe, expect, it } from 'vitest'
import {
  createYearChangeTickFormatter,
  evenlySpacedTickIndices,
  formatAxisIndianMoneyTick,
  formatAxisMonthYearTick,
  formatAxisPercentCompact,
  formatMissDaysScenarioTick,
} from './axisFormatters'

describe('formatAxisMonthYearTick', () => {
  it('keeps full month-year when not compact', () => {
    expect(formatAxisMonthYearTick('Jan 2020')).toBe('Jan 2020')
  })

  it('shortens month-year on compact screens', () => {
    expect(formatAxisMonthYearTick('Jan 2020', true)).toBe("Jan '20")
    expect(formatAxisMonthYearTick('May-2024', true)).toBe("May '24")
    expect(formatAxisMonthYearTick('2022-06-15', true)).toBe('15 Jun')
  })
})

describe('createYearChangeTickFormatter', () => {
  it('shows the year only when it changes', () => {
    const formatTick = createYearChangeTickFormatter()
    expect(formatTick('2025-07-29')).toBe("29 Jul '25")
    expect(formatTick('2025-10-15')).toBe('15 Oct')
    expect(formatTick('2025-12-01')).toBe('1 Dec')
    expect(formatTick('2026-02-01')).toBe("1 Feb '26")
    expect(formatTick('2026-05-01')).toBe('1 May')
    expect(formatTick('2026-07-24')).toBe('24 Jul')
  })

  it('uses month-year labels when the tick has no day', () => {
    const formatTick = createYearChangeTickFormatter()
    expect(formatTick('Jul 2025')).toBe("Jul '25")
    expect(formatTick('Oct 2025')).toBe('Oct')
    expect(formatTick('Feb 2026')).toBe("Feb '26")
  })
})

describe('formatAxisPercentCompact', () => {
  it('rounds on compact screens', () => {
    expect(formatAxisPercentCompact(12.36, true)).toBe('12%')
    expect(formatAxisPercentCompact(12, false)).toBe('12%')
  })
})

describe('formatAxisIndianMoneyTick', () => {
  it('uses L/Cr abbreviations when compact', () => {
    expect(formatAxisIndianMoneyTick(80_00_000, true)).toBe('₹80L')
    expect(formatAxisIndianMoneyTick(1_20_00_000, true)).toBe('₹1.2Cr')
  })

  it('uses full words when not compact', () => {
    expect(formatAxisIndianMoneyTick(80_00_000, false)).toBe('₹80 lakh')
  })
})

describe('formatMissDaysScenarioTick', () => {
  it('shortens miss-top labels on compact screens', () => {
    expect(formatMissDaysScenarioTick('Miss top 5 days', true)).toBe('Top 5')
    expect(formatMissDaysScenarioTick('Miss top 30 best days', true)).toBe('Top 30')
  })
})

describe('evenlySpacedTickIndices', () => {
  it('spans first and last indices evenly', () => {
    expect(evenlySpacedTickIndices(100, 4)).toEqual([0, 33, 66, 99])
    expect(evenlySpacedTickIndices(5, 4)).toEqual([0, 1, 3, 4])
  })

  it('handles tiny series', () => {
    expect(evenlySpacedTickIndices(0, 4)).toEqual([])
    expect(evenlySpacedTickIndices(1, 4)).toEqual([0])
    expect(evenlySpacedTickIndices(3, 5)).toEqual([0, 1, 2])
  })
})
