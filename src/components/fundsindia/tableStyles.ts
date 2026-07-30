import { cn } from '@/lib/utils'
import { APP_TABLE } from '@/lib/ui/appTableStyles'

export const FI_GRID = 'border-slate-300/80 dark:border-slate-600/70'
export const FI_TABLE = APP_TABLE

export function fiHeaderCell(className?: string) {
  return cn(
    'bg-brand px-1.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-2 sm:text-[11px] md:px-3 md:py-2.5 md:text-xs',
    className,
  )
}

export function fiSubHeaderCell(className?: string) {
  return cn(
    'bg-brand/90 px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2.5 sm:py-1.5 sm:text-[10px] md:px-3 md:py-2 md:text-[11px]',
    className,
  )
}

export function fiMultiplyHeaderCell(className?: string) {
  return cn(
    'bg-[#1e3a5f] px-1.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-2 sm:text-[11px] md:px-3 md:py-2.5 md:text-xs',
    className,
  )
}

export function fiBodyCell(className?: string) {
  return cn(
    'border px-1.5 py-1.5 text-center tabular-nums sm:px-2.5 sm:py-2 md:px-3 md:py-2',
    FI_GRID,
    className,
  )
}

export function fiStickyYearCell(className?: string) {
  return fiStickyLabelCell(className)
}

export function fiStickyLabelCell(className?: string) {
  return cn(
    'sticky left-0 z-10 min-w-[96px] border-r bg-background px-1.5 py-1.5 text-left align-top text-[11px] font-semibold sm:min-w-[120px] sm:px-2.5 sm:py-2 sm:text-xs md:min-w-[140px] md:px-3 md:py-2 lg:min-w-[180px]',
    FI_GRID,
    className,
  )
}

export function fiMatrixDataCell(className?: string) {
  return cn(
    'border px-1.5 py-1.5 text-center tabular-nums sm:px-2.5 sm:py-2 md:px-3 md:py-2.5',
    FI_GRID,
    className,
  )
}

export function fiMatrixYearCell(className?: string) {
  return cn(
    'sticky left-0 z-10 min-w-[68px] border-r px-1.5 py-1.5 align-middle text-center text-[11px] font-bold sm:min-w-[80px] sm:px-2.5 sm:py-2 sm:text-xs md:min-w-[96px] md:px-3 md:py-2.5',
    FI_GRID,
    className,
  )
}

export function fiMatrixSchemeCell(className?: string) {
  return cn(
    'min-w-[150px] max-w-[260px] border-r px-1.5 py-1.5 align-middle text-left sm:min-w-[190px] sm:px-2.5 sm:py-2 md:min-w-[220px] md:max-w-[320px] md:px-3 md:py-2.5',
    FI_GRID,
    className,
  )
}
