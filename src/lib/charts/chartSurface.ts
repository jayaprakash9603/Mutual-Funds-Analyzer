/** Theme-aware plot surface (see --chart-surface in index.css). */
export const CHART_SURFACE_BG = 'var(--chart-surface)'

export const CHART_PANEL_CLASS =
  'rounded-xl border border-border/70 bg-[var(--chart-surface)] p-3 sm:p-4 shadow-inner'

export const CHART_HEADER_CLASS =
  'border-b border-border/70 bg-[var(--chart-surface)] px-4 py-4 sm:px-6'

/** Alternating cycle bands — values switch with light/dark theme via CSS vars. */
export const CHART_CYCLE_BAND_EVEN = 'var(--chart-cycle-band-even)'
export const CHART_CYCLE_BAND_ODD = 'var(--chart-cycle-band-odd)'

export const CHART_BUCKET_NEGATIVE_BORDER = 'border-red-500/70'
export const CHART_BUCKET_POSITIVE_BORDER = 'border-emerald-500/70'
