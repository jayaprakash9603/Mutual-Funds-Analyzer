import { cn } from '@/lib/utils'

export const GOAL_TABLE_SHELL =
  'rounded-xl border border-border/70 bg-card shadow-sm dark:border-border dark:bg-card'

export function goalRowStripe(rowIndex: number): string {
  return rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/35 dark:bg-muted/20'
}

export function goalStickyLabelBg(rowIndex: number): string {
  return rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/35 dark:bg-muted/20'
}

export type HeatmapBand = {
  label: string
  className: string
}

export const CAGR_HEATMAP_BANDS: HeatmapBand[] = [
  {
    label: 'Very achievable (< 8%)',
    className: 'bg-emerald-500/15 text-emerald-950 dark:bg-emerald-500/25 dark:text-emerald-100',
  },
  {
    label: 'Realistic (8–12%)',
    className: 'bg-green-500/14 text-green-950 dark:bg-green-500/22 dark:text-green-100',
  },
  {
    label: 'Ambitious (12–18%)',
    className: 'bg-amber-500/16 text-amber-950 dark:bg-amber-500/24 dark:text-amber-50',
  },
  {
    label: 'Hard (18–30%)',
    className: 'bg-orange-500/18 text-orange-950 dark:bg-orange-500/26 dark:text-orange-50',
  },
  {
    label: 'Extreme (30%+)',
    className: 'bg-red-500/20 text-red-950 dark:bg-red-500/30 dark:text-red-50',
  },
]

export function cagrHeatmapClasses(cagrPercent: number): string {
  if (cagrPercent < 8) {
    return cn(CAGR_HEATMAP_BANDS[0].className, 'font-semibold')
  }
  if (cagrPercent < 12) {
    return cn(CAGR_HEATMAP_BANDS[1].className, 'font-medium')
  }
  if (cagrPercent < 18) {
    return cn(CAGR_HEATMAP_BANDS[2].className, 'font-medium')
  }
  if (cagrPercent < 30) {
    return cn(CAGR_HEATMAP_BANDS[3].className, 'font-semibold')
  }
  return cn(CAGR_HEATMAP_BANDS[4].className, 'font-bold')
}

export const PROBABILITY_HEATMAP_BANDS: HeatmapBand[] = [
  {
    label: 'Rare (< 30%)',
    className: 'bg-red-500/12 text-red-900 dark:bg-red-500/22 dark:text-red-100',
  },
  {
    label: 'Occasional (30–60%)',
    className: 'bg-amber-500/14 text-amber-950 dark:bg-amber-500/22 dark:text-amber-50',
  },
  {
    label: 'Likely (60–80%)',
    className: 'bg-green-500/14 text-green-950 dark:bg-green-500/22 dark:text-green-100',
  },
  {
    label: 'Very likely (80%+)',
    className: 'bg-emerald-500/16 text-emerald-950 dark:bg-emerald-500/24 dark:text-emerald-100',
  },
]

export function probabilityHeatmapClasses(percent: number | null | undefined): string {
  if (percent == null) {
    return 'bg-muted/40 text-muted-foreground'
  }
  if (percent < 30) {
    return cn(PROBABILITY_HEATMAP_BANDS[0].className, 'font-medium')
  }
  if (percent < 60) {
    return cn(PROBABILITY_HEATMAP_BANDS[1].className, 'font-medium')
  }
  if (percent < 80) {
    return cn(PROBABILITY_HEATMAP_BANDS[2].className, 'font-semibold')
  }
  return cn(PROBABILITY_HEATMAP_BANDS[3].className, 'font-bold')
}
