import * as React from 'react'
import { cn } from '@/lib/utils'

type TableProps = React.ComponentProps<'table'> & {
  scroll?: boolean
}

function Table({ className, scroll = false, ...props }: TableProps) {
  if (scroll) {
    return (
      <div className="relative w-full overflow-x-auto">
        <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
      </div>
    )
  }
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
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
        'h-11 px-3 text-center align-middle text-xs font-semibold uppercase tracking-wide',
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
        'px-3 py-3 align-middle text-center tabular-nums',
        nowrap && 'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
