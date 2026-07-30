import { appPanelSurface } from '@/lib/ui/appCardStyles'
import { cn } from '@/lib/utils'

export const APP_TABLE = 'w-full border-collapse text-[11px] leading-snug sm:text-xs md:text-sm'

export const APP_TABLE_MIN_WIDTH = {
  sm: 480,
  md: 640,
  lg: 720,
  xl: 960,
  matrix: 880,
} as const

export const APP_TABLE_SHELL = cn(appPanelSurface, 'overflow-hidden')

export const APP_TABLE_SHELL_HEADER = cn(
  'border-b border-brand/30 bg-brand px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3',
)

export const APP_TABLE_SHELL_TITLE =
  'text-sm font-bold uppercase tracking-wide text-white sm:text-base md:text-lg'

export const APP_TABLE_SHELL_SUBTITLE = 'mt-0.5 text-xs text-white/85 sm:text-sm'

export const APP_TABLE_SHELL_META = cn(
  'border-b border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground sm:px-4 sm:py-2 sm:text-xs md:px-6 md:text-sm',
)

export const APP_TABLE_SHELL_FOOTER = cn(
  'border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground sm:px-4 sm:py-2.5 sm:text-xs md:px-6 md:py-3 md:text-sm',
)

export const APP_TABLE_SCROLL_INNER = '[&_table]:w-full [&_table]:border-collapse'

export function appTableHeadCell(className?: string) {
  return cn(
    'border border-border bg-muted/60 px-1.5 py-1.5 text-left text-[10px] font-semibold sm:px-2.5 sm:py-2 sm:text-[11px] md:px-3 md:text-xs',
    className,
  )
}

export function appTableBodyCell(className?: string) {
  return cn(
    'border border-border px-1.5 py-1.5 align-middle tabular-nums sm:px-2.5 sm:py-2 md:px-3',
    className,
  )
}
