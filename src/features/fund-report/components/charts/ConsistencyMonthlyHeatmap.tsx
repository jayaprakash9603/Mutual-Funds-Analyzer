import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollTable } from '@/components/ui/scroll-table'
import { returnHeatColor } from '@/lib/charts/chartColors'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'
import { buildMonthlyHeatmapGrid } from '../../lib/consistency/monthlyHeatmapGrid'

type Consistency = FundReportRisk['consistency']

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const HEATMAP_TABLE =
  '!border-separate border-spacing-x-1 border-spacing-y-1.5 text-[11px] sm:text-xs'
const HEATMAP_HEADER_CELL =
  'h-9 px-2 py-0 align-middle font-bold whitespace-nowrap leading-none'

function YearColumn({ years }: { years: Array<{ year: number }> }) {
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
            </th>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ConsistencyMonthlyHeatmap({ consistency }: { consistency: Consistency }) {
  const { years, monthByKey, maxMonthlyAbs } = useMemo(
    () => buildMonthlyHeatmapGrid(consistency.monthlyHeatmap),
    [consistency.monthlyHeatmap],
  )

  if (years.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Monthly return history is not available in this report snapshot yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Month-by-month returns from this report snapshot (same underlying calendar data as the live
        Returns heatmap, frozen at compute time).
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
          Longest win streak: {consistency.longestWinningStreak} mo
        </Badge>
        <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-400">
          Longest loss streak: {consistency.longestLosingStreak} mo
        </Badge>
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
          Best month: {formatPercent(consistency.bestMonth, 1)}
        </Badge>
        <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-400">
          Worst month: {formatPercent(consistency.worstMonth, 1)}
        </Badge>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/40 sm:p-3">
        <ScrollTable
          pinnedLeading={<YearColumn years={years} />}
          minWidth={620}
          hint="Swipe sideways to see all monthly returns"
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
                          title="No data"
                          aria-label={`${MONTH_LABELS[monthIndex]} ${yearRow.year}: no data`}
                        >
                          <span className="inline-block h-8 w-full min-w-[3.25rem] rounded-lg border border-slate-200/40 bg-slate-100/70 dark:border-slate-700/30 dark:bg-slate-800/40 sm:min-w-[3.75rem]" />
                        </td>
                      )
                    }
                    return (
                      <td
                        key={month}
                        className="h-9 px-0.5 py-0 align-middle"
                        title={`${MONTH_LABELS[monthIndex]} ${yearRow.year}: ${cell.returnPercent.toFixed(2)}%`}
                      >
                        <span
                          className="inline-flex h-8 w-full min-w-[3.25rem] items-center justify-center rounded-lg font-mono text-[11px] font-semibold tabular-nums shadow-2xs transition-transform hover:scale-105 sm:min-w-[3.75rem] sm:text-xs"
                          style={returnHeatColor(cell.returnPercent, maxMonthlyAbs)}
                        >
                          {cell.returnPercent.toFixed(2)}%
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
