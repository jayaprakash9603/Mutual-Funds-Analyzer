import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { returnHeatColor } from '@/lib/charts/chartColors'
import { cn } from '@/lib/utils'
import type { CalendarReturns } from '../../schemas'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const HEATMAP_TABLE =
  '!border-separate border-spacing-x-1 border-spacing-y-1.5 text-[11px] sm:text-xs'
const HEATMAP_HEADER_CELL =
  'h-9 px-2 py-0 align-middle font-bold whitespace-nowrap leading-none'

type AlphaCell = {
  year: number
  month: number
  alphaPercent: number
}

type YearRow = CalendarReturns['years'][number]

function YearColumn({ years }: { years: YearRow[] }) {
  return (
    <table className={cn(HEATMAP_TABLE, 'bg-slate-50 text-left dark:bg-slate-900')}>
      <thead>
        <tr>
          <th
            scope="col"
            className={cn(
              HEATMAP_HEADER_CELL,
              'min-w-[3.5rem] bg-slate-100 px-3 text-slate-800 dark:bg-slate-800 dark:text-slate-200 sm:min-w-[4rem]',
            )}
          >
            Year
          </th>
        </tr>
      </thead>
      <tbody>
        {years.map((yearRow, rowIndex) => (
          <tr key={yearRow.year}>
            <th
              scope="row"
              className={cn(
                'h-9 whitespace-nowrap px-3 py-0 align-middle text-xs font-bold tabular-nums text-slate-800 sm:text-sm dark:text-slate-200',
                rowIndex % 2 === 0
                  ? 'bg-slate-50 dark:bg-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800',
              )}
            >
              {yearRow.year}
              {yearRow.partial ? (
                <span className="ml-0.5 text-[10px] font-normal text-slate-500 dark:text-slate-400">*</span>
              ) : null}
            </th>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function CalendarAlphaHeatmap({ data }: { data: CalendarReturns }) {
  const { years, monthByKey, yearAlphaByYear, maxMonthlyAbs, maxYearlyAbs } = useMemo(() => {
    const benchMonthMap = new Map(
      (data.benchmarkMonths ?? []).map((month) => [`${month.year}-${month.month}`, month.returnPercent]),
    )
    const benchYearMap = new Map(
      (data.benchmarkYears ?? []).map((year) => [year.year, year.returnPercent]),
    )

    const alphaMonths: AlphaCell[] = []
    for (const month of data.months) {
      const bench = benchMonthMap.get(`${month.year}-${month.month}`)
      if (bench == null) continue
      alphaMonths.push({
        year: month.year,
        month: month.month,
        alphaPercent: month.returnPercent - bench,
      })
    }

    const monthByKey = new Map(alphaMonths.map((cell) => [`${cell.year}-${cell.month}`, cell]))
    const yearAlphaByYear = new Map<number, number>()
    for (const year of data.years) {
      const bench = benchYearMap.get(year.year)
      if (bench == null) continue
      yearAlphaByYear.set(year.year, year.returnPercent - bench)
    }

    const monthlyAbs = alphaMonths.length
      ? Math.max(...alphaMonths.map((cell) => Math.abs(cell.alphaPercent)), 5)
      : 5
    const yearlyAbs = yearAlphaByYear.size
      ? Math.max(...[...yearAlphaByYear.values()].map((value) => Math.abs(value)), 8)
      : 8

    return {
      years: data.years,
      monthByKey,
      yearAlphaByYear,
      maxMonthlyAbs: monthlyAbs,
      maxYearlyAbs: yearlyAbs,
    }
  }, [data])

  if (!data.benchmarkMonths?.length) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        No benchmark mapped for this fund — alpha vs benchmark is unavailable.
      </p>
    )
  }

  if (monthByKey.size === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Not enough overlapping fund/benchmark months to compute calendar alpha.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Each cell is fund return minus benchmark return for that month. Green means the fund won the
        month; red means it lagged. Values are percentage points of alpha, not raw returns.
      </p>
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/40 sm:p-3">
        <ScrollTable
          pinnedLeading={<YearColumn years={years} />}
          minWidth={680}
          hint="Swipe sideways to see all monthly alpha"
        >
          <table className={cn(HEATMAP_TABLE, 'w-full text-center')}>
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                {MONTH_LABELS.map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={cn(HEATMAP_HEADER_CELL, 'text-slate-700 dark:text-slate-300')}
                  >
                    {label}
                  </th>
                ))}
                <th
                  scope="col"
                  className={cn(
                    HEATMAP_HEADER_CELL,
                    'border-l border-slate-200 px-3 text-slate-900 dark:border-slate-700 dark:text-slate-100',
                  )}
                >
                  Yearly α
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
                  {MONTH_LABELS.map((_, monthIndex) => {
                    const month = monthIndex + 1
                    const cell = monthByKey.get(`${yearRow.year}-${month}`)
                    if (!cell) {
                      return (
                        <td
                          key={month}
                          className="h-9 px-0.5 py-0 align-middle"
                          title="No overlapping benchmark data"
                        >
                          <span className="inline-block h-8 w-full min-w-[3.25rem] rounded-lg border border-slate-200/40 bg-slate-100/70 dark:border-slate-700/30 dark:bg-slate-800/40 sm:min-w-[3.75rem]" />
                        </td>
                      )
                    }
                    const sign = cell.alphaPercent >= 0 ? '+' : ''
                    return (
                      <td
                        key={month}
                        className="h-9 px-0.5 py-0 align-middle"
                        title={`${MONTH_LABELS[monthIndex]} ${yearRow.year}: ${sign}${cell.alphaPercent.toFixed(2)} pp alpha`}
                      >
                        <span
                          className="inline-flex h-8 w-full min-w-[3.25rem] items-center justify-center rounded-lg font-mono text-[11px] font-semibold tabular-nums shadow-2xs transition-transform hover:scale-105 sm:min-w-[3.75rem] sm:text-xs"
                          style={returnHeatColor(cell.alphaPercent, maxMonthlyAbs)}
                        >
                          {sign}
                          {cell.alphaPercent.toFixed(2)}
                        </span>
                      </td>
                    )
                  })}
                  <td className="h-9 border-l border-slate-200 pl-1.5 px-0.5 py-0 align-middle dark:border-slate-700">
                    {yearAlphaByYear.has(yearRow.year) ? (
                      <span
                        className="inline-flex h-8 w-full min-w-[3.75rem] items-center justify-center rounded-lg font-mono text-[11px] font-bold tabular-nums shadow-2xs sm:min-w-[4.25rem] sm:text-xs"
                        style={returnHeatColor(yearAlphaByYear.get(yearRow.year)!, maxYearlyAbs)}
                        title={`${yearRow.year} yearly alpha`}
                      >
                        {yearAlphaByYear.get(yearRow.year)! >= 0 ? '+' : ''}
                        {yearAlphaByYear.get(yearRow.year)!.toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-block h-8 w-full min-w-[3.75rem] rounded-lg border border-slate-200/40 bg-slate-100/70 dark:border-slate-700/30 dark:bg-slate-800/40 sm:min-w-[4.25rem]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
        <span aria-hidden="true" className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Fund lagged
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Fund won
        </span>
        <span>· values in percentage points (pp)</span>
      </div>
    </div>
  )
}
