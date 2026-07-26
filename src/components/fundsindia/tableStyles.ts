import { cn } from '@/lib/utils'

export const FI_GRID = 'border-slate-300/80 dark:border-slate-600/70'
export const FI_TABLE = 'w-full min-w-[720px] border-collapse text-sm'

export function fiHeaderCell(className?: string) {
  return cn(
    'bg-brand px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white',
    className,
  )
}

export function fiSubHeaderCell(className?: string) {
  return cn(
    'bg-brand/90 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-white',
    className,
  )
}

export function fiMultiplyHeaderCell(className?: string) {
  return cn(
    'bg-[#1e3a5f] px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white',
    className,
  )
}

export function fiBodyCell(className?: string) {
  return cn('border px-2.5 py-2 text-center tabular-nums', FI_GRID, className)
}

export function fiStickyYearCell(className?: string) {
  return cn(
    'sticky left-0 z-10 border-r bg-white px-3 py-2 text-left align-top font-semibold dark:bg-card',
    FI_GRID,
    className,
  )
}
