import { COB_MODERATE, COB_STRONG, VOLATILITY_ELEVATED, VOLATILITY_HIGH } from './constants'

export const CHART_COLORS = {
  /** Mirrors the --brand CSS variable, for SVG fills that cannot use a Tailwind class. */
  brand: '#1a8354',
  fund: '#16a34a',
  benchmark: '#ea580c',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  red: '#dc2626',
  blue: '#2563eb',
  muted: '#94a3b8',
  track: '#e2e8f0',
} as const

export const CHART_SERIES = [
  CHART_COLORS.fund,
  CHART_COLORS.benchmark,
  CHART_COLORS.blue,
  CHART_COLORS.violet,
  CHART_COLORS.amber,
] as const

export const CHART_GRID = 'currentColor'
export const CHART_MUTED = CHART_COLORS.muted

/** Shared by the sub-header rows of the matrix and rolling-returns tables. */
export const TABLE_SUBHEAD_CLASS = 'bg-brand/90 text-white'
export const TABLE_HEAD_CLASS = 'bg-brand text-white'

export function cobColor(cob: number) {
  if (cob > COB_STRONG) return CHART_COLORS.fund
  if (cob > COB_MODERATE) return CHART_COLORS.amber
  return CHART_COLORS.red
}

export function volatilityColor(volatilityPercent: number) {
  if (volatilityPercent > VOLATILITY_HIGH) return CHART_COLORS.red
  if (volatilityPercent > VOLATILITY_ELEVATED) return CHART_COLORS.amber
  return CHART_COLORS.fund
}

export function outperformanceColor(outperforms: boolean) {
  return outperforms ? CHART_COLORS.fund : CHART_COLORS.benchmark
}

/** Green for gains, red for losses — used on consistency / return bars. */
export function signedReturnColor(value: number) {
  return value < 0 ? CHART_COLORS.red : CHART_COLORS.fund
}

/** FundsIndia-style heatmap bands: >=10%, 7-10%, 0-7%, <0% */
export const RETURN_BAND_COLORS = {
  STRONG: CHART_COLORS.fund,
  MODERATE: CHART_COLORS.amber,
  WEAK: '#cbd5e1',
  NEGATIVE: CHART_COLORS.red,
} as const

export function bandColor(band: string | null | undefined) {
  switch (band) {
    case 'STRONG':
      return RETURN_BAND_COLORS.STRONG
    case 'MODERATE':
      return RETURN_BAND_COLORS.MODERATE
    case 'WEAK':
      return RETURN_BAND_COLORS.WEAK
    case 'NEGATIVE':
      return RETURN_BAND_COLORS.NEGATIVE
    default:
      return 'transparent'
  }
}
