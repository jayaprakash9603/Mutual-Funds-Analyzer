/** Theme-aware plot surface (see --chart-surface in index.css). */
export const CHART_SURFACE_BG = 'var(--chart-surface)'

export const CHART_PANEL_CLASS =
  'rounded-xl border border-border/70 bg-[var(--chart-surface)] p-3 sm:p-4 shadow-inner'

/** Borderless inset surface for charts/tables already inside ReportInsightCard. */
export const CHART_INSET_CLASS = 'rounded-lg bg-[var(--chart-surface)] p-2 sm:p-3'

/** Lets wide tables use full card width on mobile without an extra inner frame. */
export const INSIDE_CARD_BLEED_CLASS =
  '-mx-3 w-[calc(100%+1.5rem)] max-w-none sm:mx-0 sm:w-full'

export const INSIDE_CARD_TABLE_CLASS =
  '-mx-3 w-[calc(100%+1.5rem)] max-w-none rounded-none border-x-0 border-b-0 sm:mx-0 sm:w-full sm:rounded-lg sm:border sm:border-border/60'

export const CHART_HEADER_CLASS =
  'border-b border-border/70 bg-[var(--chart-surface)] px-4 py-4 sm:px-6'

/** Alternating cycle bands — values switch with light/dark theme via CSS vars. */
export const CHART_CYCLE_BAND_EVEN = 'var(--chart-cycle-band-even)'
export const CHART_CYCLE_BAND_ODD = 'var(--chart-cycle-band-odd)'

export const CHART_BUCKET_NEGATIVE_BORDER = 'border-red-500/70'
export const CHART_BUCKET_POSITIVE_BORDER = 'border-emerald-500/70'
