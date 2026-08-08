import { describe, expect, it } from 'vitest'
import {
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
    expect(formatAxisMonthYearTick('2022-06-15', true)).toBe("Jun '22")
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
