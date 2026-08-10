import { COB_MODERATE, COB_STRONG, VOLATILITY_ELEVATED, VOLATILITY_HIGH } from '../constants'

export const CHART_COLORS = {
  /** Theme-aware via CSS variables — readable green/red on light and dark surfaces. */
  brand: 'var(--brand)',
  fund: 'var(--chart-positive)',
  benchmark: '#fb923c',
  amber: '#fbbf24',
  violet: '#a78bfa',
  red: 'var(--chart-negative)',
  blue: '#3b82f6',
  muted: '#64748b',
  track: '#1e293b',
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

/** Seaborn-style RdYlGn stops for calendar-return heatmaps. */
const RETURN_HEAT_STOPS: ReadonlyArray<{ t: number; r: number; g: number; b: number }> = [
  { t: -1.0, r: 165, g: 0, b: 38 }, // #a50026 Deep Crimson Red
  { t: -0.6, r: 215, g: 48, b: 39 }, // #d73027 Vivid Red
  { t: -0.3, r: 244, g: 109, b: 67 }, // #f46d43 Orange-Red
  { t: -0.15, r: 253, g: 174, b: 97 }, // #fdae61 Soft Orange
  { t: 0.0, r: 254, g: 224, b: 139 }, // #fee08b Soft Cream Yellow
  { t: 0.15, r: 217, g: 239, b: 139 }, // #d9ef8b Soft Yellow-Green
  { t: 0.3, r: 166, g: 217, b: 106 }, // #a6d96a Light Bright Green
  { t: 0.5, r: 102, g: 189, b: 99 }, // #66bd63 Vibrant Green
  { t: 0.75, r: 26, g: 152, b: 80 }, // #1a9850 Rich Green
  { t: 1.0, r: 0, g: 104, b: 55 }, // #006837 Dark Forest Green
]

function lerpChannel(a: number, b: number, u: number) {
  return Math.round(a + (b - a) * u)
}

function interpolateHeatStop(t: number): { r: number; g: number; b: number } {
  const clamped = Math.max(-1, Math.min(1, t))
  for (let i = 1; i < RETURN_HEAT_STOPS.length; i++) {
    const left = RETURN_HEAT_STOPS[i - 1]
    const right = RETURN_HEAT_STOPS[i]
    if (clamped <= right.t) {
      const span = right.t - left.t || 1
      const u = (clamped - left.t) / span
      return {
        r: lerpChannel(left.r, right.r, u),
        g: lerpChannel(left.g, right.g, u),
        b: lerpChannel(left.b, right.b, u),
      }
    }
  }
  const last = RETURN_HEAT_STOPS[RETURN_HEAT_STOPS.length - 1]
  return { r: last.r, g: last.g, b: last.b }
}

/**
 * Diverging red→cream→green fill for calendar return cells.
 * `maxAbs` normalises intensity; near-zero values stay pale cream.
 */
export function returnHeatColor(value: number, maxAbs: number): { backgroundColor: string; color: string } {
  if (!Number.isFinite(value) || !(maxAbs > 0)) {
    return { backgroundColor: 'transparent', color: 'inherit' }
  }
  const { r, g, b } = interpolateHeatStop(value / maxAbs)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: luminance < 0.55 ? '#ffffff' : '#1c1917',
  }
}

/**
 * Heatmap bands tuned for readable contrast in light + dark UI.
 * Pair each fill with {@link bandTextColor} (never white-on-light-gray).
 */
export const RETURN_BAND_COLORS = {
  STRONG: 'var(--chart-positive)',
  MODERATE: '#f59e0b',
  WEAK: '#94a3b8',
  NEGATIVE: 'var(--chart-negative)',
} as const

/** Dark ink on pale/amber bands; white on saturated green/red. */
export const RETURN_BAND_TEXT = {
  STRONG: '#ffffff',
  MODERATE: '#1c1917',
  WEAK: '#0f172a',
  NEGATIVE: '#ffffff',
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

export function bandTextColor(band: string | null | undefined) {
  switch (band) {
    case 'STRONG':
      return RETURN_BAND_TEXT.STRONG
    case 'MODERATE':
      return RETURN_BAND_TEXT.MODERATE
    case 'WEAK':
      return RETURN_BAND_TEXT.WEAK
    case 'NEGATIVE':
      return RETURN_BAND_TEXT.NEGATIVE
    default:
      return 'inherit'
  }
}
