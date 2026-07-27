export const TRADING_DAYS = 252
export const DEFAULT_START_DATE = '01-01-2013'
export const DEFAULT_PERIOD = '5 Year'

export const PERIODS = ['1 Year', '3 Year', '5 Year', '7 Year', '10 Year'] as const
export type Period = (typeof PERIODS)[number]

export const MATRIX_PERIODS = ['1 Year', '3 Year', '5 Year', '7 Year', '10 Year', '15 Year'] as const

/** Chart series are downsampled to this many points before rendering. */
export const MAX_CHART_POINTS = 400

/** Chance of beating the benchmark, in percent, above which a fund reads as strong / moderate. */
export const COB_STRONG = 70
export const COB_MODERATE = 50

/** Annualised volatility, in percent, above which risk reads as high / elevated. */
export const VOLATILITY_HIGH = 18
export const VOLATILITY_ELEVATED = 12

/** Fund search waits for this many characters and this idle gap before hitting the API. */
export const SEARCH_MIN_QUERY_LENGTH = 3
export const SEARCH_DEBOUNCE_MS = 400

export const MAX_COMPARE_FUNDS = 5

/** Tailwind's sm breakpoint, used by the media query hook to pick chart heights. */
export const MOBILE_BREAKPOINT_PX = 639

/** Tailwind lg minus 1px — tablet portrait/landscape upper bound for layout hooks. */
export const TABLET_BREAKPOINT_PX = 1023

export const CATEGORIES = [
  { label: 'All', value: 'All' },
  { label: 'Large Cap', value: 'Equity: Large Cap' },
  { label: 'Mid Cap', value: 'Equity: Mid Cap' },
  { label: 'Small Cap', value: 'Equity: Small Cap' },
  { label: 'Flexi Cap', value: 'Equity: Flexi Cap' },
  { label: 'ELSS', value: 'Equity: ELSS' },
  { label: 'Multi Cap', value: 'Equity: Multi Cap' },
  { label: 'Focused', value: 'Equity: Focused' },
  { label: 'Hybrid Dynamic', value: 'Hybrid: Dynamic Asset Allocation' },
  { label: 'Hybrid Aggressive', value: 'Hybrid: Aggressive' },
  { label: 'Hybrid Balanced', value: 'Hybrid: Balanced' },
  { label: 'Debt Short', value: 'Debt: Short Duration' },
] as const

export const SORT_OPTIONS = [
  { label: 'Highest COB', value: 'cob' },
  { label: 'Highest Sharpe', value: 'sharpe' },
  { label: 'Lowest Risk', value: 'risk' },
  { label: 'Highest Alpha', value: 'alpha' },
  { label: 'Best Rolling Return', value: 'rollingReturn' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']

export const RISK_LEVELS = [
  { label: 'Very Low', maxVol: 8 },
  { label: 'Low', maxVol: VOLATILITY_ELEVATED },
  { label: 'Medium', maxVol: VOLATILITY_HIGH },
  { label: 'High', maxVol: 25 },
  { label: 'Very High', maxVol: Infinity },
] as const

export const INSIGHT_RATINGS = {
  Passed: 'Excellent',
  Average: 'Good',
  Weak: 'Caution',
  Avoid: 'Avoid',
} as const
