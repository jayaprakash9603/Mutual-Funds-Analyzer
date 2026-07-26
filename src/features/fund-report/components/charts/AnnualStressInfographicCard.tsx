import { useMemo } from 'react'
import { fiMultiplyHeaderCell } from '@/components/fundsindia/tableStyles'
import { cn } from '@/lib/utils'
import type { FundReport } from '../../schemas'
import {
  computeAnnualStressStats,
  computePositiveYearDrawdownBuckets,
  formatInfographicPercent,
  splitYearsIntoColumns,
  type CalendarYearRow,
} from '../../lib/stress/annualStressAnalysis'

type CalendarYears = FundReport['consistency']['calendarYears']

type InfographicRow = CalendarYearRow & { isPartialYear?: boolean }

interface AnnualStressInfographicCardProps {
  calendarYears: CalendarYears
  fundName: string
  dataTo?: string
  columnCount?: number
}

export function AnnualStressInfographicCard({
  calendarYears,
  fundName,
  dataTo,
  columnCount = 3,
}: AnnualStressInfographicCardProps) {
  const rows = useMemo<InfographicRow[]>(() => {
    const lastYear = dataTo ? new Date(dataTo).getUTCFullYear() : null
    const lastMonth = dataTo ? new Date(dataTo).getUTCMonth() : 11

    return calendarYears.map((row) => ({
      ...row,
      isPartialYear: lastYear === row.year && lastMonth < 11,
    }))
  }, [calendarYears, dataTo])

  const stats = useMemo(() => computeAnnualStressStats(rows), [rows])
  const buckets = useMemo(() => computePositiveYearDrawdownBuckets(rows), [rows])
  const columns = useMemo(
    () => splitYearsIntoColumns(rows, columnCount),
    [rows, columnCount],
  )

  if (rows.length === 0) return null

  const headline =
    stats.positiveYears > 0 && buckets.moderate + buckets.severe > 0
      ? `${stats.positiveYears} out of ${stats.totalYears} years ended with positive returns – but even these positive years had 10–20% intra-year declines.`
      : `${stats.positiveYears} out of ${stats.totalYears} calendar years ended with positive returns for ${fundName}.`

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-700 dark:bg-muted/20 sm:px-5">
        <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-100 sm:text-base">
          {headline}
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="grid gap-0 border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-3 dark:border-slate-700">
          {columns.map((column, columnIndex) => (
            <YearColumnTable key={columnIndex} rows={column} />
          ))}
        </div>

        <aside className="flex flex-col justify-end border-t border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-muted/15 lg:border-l lg:border-t-0">
          <IntraYearDeclinesSummary buckets={buckets} />
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            Green = calendar year ended positive. Red = calendar year ended negative. Drawdown =
            worst peak-to-trough fall within that year.
          </p>
        </aside>
      </div>
    </div>
  )
}

function YearColumnTable({ rows }: { rows: InfographicRow[] }) {
  return (
    <div className="border-b border-r border-slate-200 last:border-r-0 dark:border-slate-700">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell('text-left')}>Years</th>
            <th className={fiMultiplyHeaderCell()}>CY Returns</th>
            <th className={fiMultiplyHeaderCell()}>Drawdown</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <YearDataRow key={row.year} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function YearDataRow({ row }: { row: InfographicRow }) {
  const positive = row.returnPercent > 0
  const toneClass = positive
    ? 'bg-emerald-500 text-white'
    : 'bg-red-500 text-white'

  const yearLabel = row.isPartialYear ? `${row.year} YTD` : String(row.year)

  return (
    <tr className="border-b border-slate-200/80 last:border-b-0 dark:border-slate-700/80">
      <td className={cn('px-2 py-1.5 text-left font-semibold tabular-nums sm:px-2.5 sm:py-2', toneClass)}>
        {yearLabel}
      </td>
      <td className={cn('px-2 py-1.5 text-center font-bold tabular-nums sm:px-2.5 sm:py-2', toneClass)}>
        {formatInfographicPercent(row.returnPercent)}
      </td>
      <td className="bg-white px-2 py-1.5 text-center font-semibold tabular-nums text-red-600 dark:bg-card dark:text-red-400 sm:px-2.5 sm:py-2">
        {formatInfographicPercent(row.intraYearDrawdown)}
      </td>
    </tr>
  )
}

function IntraYearDeclinesSummary({
  buckets,
}: {
  buckets: ReturnType<typeof computePositiveYearDrawdownBuckets>
}) {
  const total = buckets.totalPositiveYears

  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground">No positive calendar years in this history.</p>
    )
  }

  const rows = [
    { label: '0 to < -10%', count: buckets.mild },
    { label: '-10% to < -20%', count: buckets.moderate },
    { label: '> -20%', count: buckets.severe },
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300/90 dark:border-slate-600">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th
              colSpan={2}
              className={fiMultiplyHeaderCell('py-2 text-[11px]')}
            >
              Intra Year Declines
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-slate-200 dark:border-slate-700">
              <td className="border-r border-slate-200 bg-white px-2.5 py-2 font-medium text-slate-700 dark:border-slate-700 dark:bg-card dark:text-slate-300">
                {row.label}
              </td>
              <td className="bg-white px-2.5 py-2 text-center font-semibold tabular-nums dark:bg-card">
                {row.count} out of {total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
