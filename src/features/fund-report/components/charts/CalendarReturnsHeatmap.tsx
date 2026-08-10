import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { returnHeatColor } from '@/lib/charts/chartColors'
import { cn } from '@/lib/utils'
import { useCalendarReturns } from '../../hooks/useCalendarReturns'
import type { CalendarReturns } from '../../schemas'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

type MonthCell = CalendarReturns['months'][number]
type YearRow = CalendarReturns['years'][number]

function formatReturn(value: number) {
  return `${value.toFixed(2)}%`
}

function cellTitle(cell: MonthCell | undefined, yearRow: YearRow | undefined, kind: 'month' | 'year') {
  if (kind === 'year' && yearRow) {
    const partial = yearRow.partial ? ' (partial year)' : ''
    return `${yearRow.year} yearly${partial}: ${yearRow.returnPercent.toFixed(2)}% · NAV ${yearRow.startNav.toFixed(2)} → ${yearRow.endNav.toFixed(2)}`
  }
  if (!cell) return 'No data'
  return `${MONTH_LABELS[cell.month - 1]} ${cell.year}: ${cell.returnPercent.toFixed(2)}% · ${cell.startDate} (${cell.startNav.toFixed(2)}) → ${cell.endDate} (${cell.endNav.toFixed(2)})`
}

export function CalendarReturnsHeatmap({
  scheme,
  startDate,
  offlineView = false,
}: {
  scheme: string
  startDate?: string
  offlineView?: boolean
}) {
  const { data, loading, error, retry } = useCalendarReturns(
    offlineView ? null : scheme,
    startDate,
    !offlineView,
  )

  const { years, monthByKey, maxMonthlyAbs, maxYearlyAbs } = useMemo(() => {
    if (!data) {
      return {
        years: [] as YearRow[],
        monthByKey: new Map<string, MonthCell>(),
        maxMonthlyAbs: 15,
        maxYearlyAbs: 25,
      }
    }
    const map = new Map<string, MonthCell>()
    for (const month of data.months) {
      map.set(`${month.year}-${month.month}`, month)
    }
    const monthlyAbs = data.months.length
      ? Math.max(...data.months.map((m) => Math.abs(m.returnPercent)), 10)
      : 15
    const yearlyAbs = data.years.length
      ? Math.max(...data.years.map((y) => Math.abs(y.returnPercent)), 20)
      : 25

    return {
      years: data.years,
      monthByKey: map,
      maxMonthlyAbs: monthlyAbs,
      maxYearlyAbs: yearlyAbs,
    }
  }, [data])

  if (offlineView) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Calendar returns need live NAV history and are not included in shared snapshots.
      </p>
    )
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="text-destructive">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={retry}>
          Retry
        </Button>
      </div>
    )
  }

  if (loading && !data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />
  }

  if (!data || years.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Not enough NAV history to build a calendar returns heatmap yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 sm:p-3.5 md:p-4 shadow-2xs">
        <table className="w-full border-separate border-spacing-x-1 border-spacing-y-1.5 text-center text-[11px] sm:text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/70">
              <th
                scope="col"
                className="sticky left-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 px-3 py-2 text-left font-bold text-slate-800 dark:text-slate-200 backdrop-blur-md rounded-l-lg"
              >
                Year
              </th>
              {MONTH_LABELS.map((label) => (
                <th key={label} scope="col" className="px-1.5 py-2 font-bold text-slate-700 dark:text-slate-300">
                  {label}
                </th>
              ))}
              <th
                scope="col"
                className="border-l border-slate-200/80 dark:border-slate-700/80 px-3 py-2 font-bold text-slate-900 dark:text-slate-100 rounded-r-lg"
              >
                Yearly
              </th>
            </tr>
          </thead>
          <tbody>
            {years.map((yearRow, rowIndex) => (
              <tr
                key={yearRow.year}
                className={cn(
                  'transition-colors',
                  rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-slate-100/30 dark:bg-slate-800/20',
                )}
              >
                <th
                  scope="row"
                  className={cn(
                    'sticky left-0 z-10 px-3 py-1.5 text-left font-bold tabular-nums text-slate-800 dark:text-slate-200 backdrop-blur-md text-xs sm:text-sm rounded-l-lg',
                    rowIndex % 2 === 0 ? 'bg-slate-50/95 dark:bg-slate-900/95' : 'bg-slate-100/95 dark:bg-slate-800/95',
                  )}
                >
                  {yearRow.year}
                  {yearRow.partial ? (
                    <span className="ml-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">*</span>
                  ) : null}
                </th>
                {MONTH_LABELS.map((_, monthIndex) => {
                  const month = monthIndex + 1
                  const cell = monthByKey.get(`${yearRow.year}-${month}`)
                  if (!cell) {
                    return (
                      <td
                        key={month}
                        className="px-0.5 py-0.5"
                        title="No data"
                        aria-label={`${MONTH_LABELS[monthIndex]} ${yearRow.year}: no data`}
                      >
                        <span className="inline-block h-8 w-full min-w-[3.25rem] sm:min-w-[3.75rem] rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30" />
                      </td>
                    )
                  }
                  const style = returnHeatColor(cell.returnPercent, maxMonthlyAbs)
                  return (
                    <td
                      key={month}
                      className="px-0.5 py-0.5"
                      title={cellTitle(cell, undefined, 'month')}
                    >
                      <span
                        className="inline-flex h-8 w-full min-w-[3.25rem] sm:min-w-[3.75rem] items-center justify-center rounded-lg font-mono text-[11px] sm:text-xs font-semibold tabular-nums shadow-2xs transition-transform hover:scale-105"
                        style={style}
                      >
                        {formatReturn(cell.returnPercent)}
                      </span>
                    </td>
                  )
                })}
                <td className="border-l border-slate-200/80 dark:border-slate-700/80 pl-1.5 px-0.5 py-0.5" title={cellTitle(undefined, yearRow, 'year')}>
                  <span
                    className="inline-flex h-8 w-full min-w-[3.75rem] sm:min-w-[4.25rem] items-center justify-center rounded-lg font-mono text-[11px] sm:text-xs font-bold tabular-nums shadow-2xs transition-transform hover:scale-105"
                    style={returnHeatColor(yearRow.returnPercent, maxYearlyAbs)}
                  >
                    {formatReturn(yearRow.returnPercent)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
        <p>
          Best month {formatReturn(data.bestMonth)} · Worst month {formatReturn(data.worstMonth)} ·{' '}
          {data.positiveMonths}/{data.totalMonths} months positive
          {years.some((y) => y.partial) ? ' · * partial year' : ''}
        </p>
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="text-[10px] font-semibold">Loss</span>
          <span
            className="h-2.5 w-28 rounded-full sm:w-36 shadow-2xs"
            style={{
              background:
                'linear-gradient(90deg, #a50026, #d73027, #f46d43, #fdae61, #fee08b, #d9ef8b, #a6d96a, #66bd63, #1a9850, #006837)',
            }}
          />
          <span className="text-[10px] font-semibold">Gain</span>
        </div>
      </div>
    </div>
  )
}
