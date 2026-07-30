import { cn } from '@/lib/utils'

export const appCardSurface = cn(
  'rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm',
  'sm:rounded-xl',
)

export const appCardSurfaceInset = cn(appCardSurface, 'bg-card/90')

export const appMetricGrid = cn(
  'grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-4',
)

export const appMetricGridCompact = cn(
  'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3',
)

export const appMetricGridWide = cn(
  'grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
)

export function appMetricCardClasses(size: 'sm' | 'md' | 'lg' = 'md') {
  const padding = {
    sm: 'p-2 sm:p-2.5',
    md: 'p-2.5 sm:p-3 md:p-4',
    lg: 'p-3 sm:p-4 md:p-5',
  }[size]

  return cn(appCardSurface, padding, 'min-w-0')
}

export function appMetricLabelClasses(size: 'sm' | 'md' | 'lg' = 'md') {
  return cn(
    'mb-0.5 flex items-center gap-1 font-medium uppercase tracking-wide text-muted-foreground sm:mb-1',
    size === 'lg' ? 'text-[10px] sm:text-xs' : 'text-[10px] sm:text-xs',
  )
}

export function appMetricValueClasses(
  variant: 'text' | 'numeric' = 'numeric',
  size: 'sm' | 'md' | 'lg' = 'md',
) {
  const textSize = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base md:text-lg',
    lg: 'text-base sm:text-lg md:text-2xl',
  }[size]

  const font =
    variant === 'numeric'
      ? 'font-mono tabular-nums'
      : 'break-words font-medium leading-snug'

  return cn('font-semibold tracking-tight text-foreground', textSize, font)
}

export function appMetricHintClasses(size: 'sm' | 'md' | 'lg' = 'md') {
  return cn(
    'mt-0.5 text-muted-foreground sm:mt-1',
    size === 'lg' ? 'text-[11px] sm:text-sm' : 'text-[10px] sm:text-xs',
  )
}

export const appCardHeaderPadding = 'gap-1 p-3 pb-2 sm:gap-1.5 sm:p-5 sm:pb-3'
export const appCardContentPadding = 'p-3 pt-0 sm:p-5 sm:pt-0'
export const appCardTitle = 'text-base font-semibold leading-tight tracking-tight sm:text-lg'
export const appCardDescription = 'text-xs leading-relaxed text-muted-foreground sm:text-sm'

export const appPanelSurface = cn(
  'overflow-hidden rounded-lg border border-border/70 bg-card text-card-foreground shadow-sm sm:rounded-xl',
)

export const appPanelHeader = cn(
  'border-b border-border/60 px-3 py-2.5 sm:px-5 sm:py-3.5',
)

export const appPanelBody = cn('px-3 py-3 sm:px-5 sm:py-4')

export const appHighlightCard = cn(appCardSurface, 'p-3 sm:p-4 md:p-5')
