export const RISK_FREE_RATE = 0.06
export const TRADING_DAYS = 252
export const DEFAULT_START_DATE = '01-01-2013'
export const DEFAULT_PERIOD = '5 Year'

export const PERIODS = ['1 Year', '3 Year', '5 Year', '7 Year', '10 Year'] as const
export type Period = (typeof PERIODS)[number]

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

export const OVERALL_RATINGS = {
  3: { label: 'Passed', color: 'emerald' },
  2: { label: 'Average', color: 'amber' },
  1: { label: 'Weak', color: 'orange' },
  0: { label: 'Avoid', color: 'red' },
} as const

export const RISK_LEVELS = [
  { label: 'Very Low', maxVol: 8 },
  { label: 'Low', maxVol: 12 },
  { label: 'Medium', maxVol: 18 },
  { label: 'High', maxVol: 25 },
  { label: 'Very High', maxVol: Infinity },
] as const

export const INSIGHT_RATINGS = {
  Passed: 'Excellent',
  Average: 'Good',
  Weak: 'Caution',
  Avoid: 'Avoid',
} as const
