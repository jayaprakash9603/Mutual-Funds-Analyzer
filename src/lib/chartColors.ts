export const CHART_COLORS = {
  fund: '#16a34a',
  benchmark: '#ea580c',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  red: '#dc2626',
  blue: '#2563eb',
} as const

export const CHART_SERIES = [
  CHART_COLORS.fund,
  CHART_COLORS.benchmark,
  CHART_COLORS.blue,
  CHART_COLORS.violet,
  CHART_COLORS.amber,
] as const

export const CHART_GRID = 'currentColor'
export const CHART_MUTED = '#94a3b8'
