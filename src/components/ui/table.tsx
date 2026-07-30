import * as React from 'react'
import { cn } from '@/lib/utils'
import { APP_TABLE } from '@/lib/ui/appTableStyles'

type TableProps = React.ComponentProps<'table'> & {
  scroll?: boolean
}

function Table({ className, scroll = false, ...props }: TableProps) {
  if (scroll) {
    return (
      <div className="scrollbar-thin relative w-full overflow-x-auto overscroll-x-contain">
        <table className={cn(APP_TABLE, className)} {...props} />
      </div>
    )
  }
  return <table className={cn(APP_TABLE, className)} {...props} />
}

type TableHeadProps = React.ComponentProps<'th'> & {
  nowrap?: boolean
}

type TableCellProps = React.ComponentProps<'td'> & {
  nowrap?: boolean
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn('border-b border-border/40 transition-colors hover:bg-muted/30', className)}
      {...props}
    />
  )
}

function TableHead({ className, nowrap = false, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-9 px-1.5 text-center align-middle text-[10px] font-semibold uppercase tracking-wide sm:h-11 sm:px-2.5 sm:text-[11px] md:px-3 md:text-xs',
        nowrap && 'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, nowrap = false, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'px-1.5 py-2 align-middle text-center tabular-nums sm:px-2.5 sm:py-2.5 md:px-3 md:py-3',
        nowrap && 'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
