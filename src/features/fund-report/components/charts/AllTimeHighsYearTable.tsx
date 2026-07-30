import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { APP_TABLE_SHELL, appTableBodyCell, appTableHeadCell } from '@/lib/ui/appTableStyles'
import { cn } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'

type AllTimeHighs = FundReportRisk['allTimeHighs']

function chunkYears<T>(rows: T[], columns: number): T[][] {
  if (rows.length === 0) {
    return []
  }
  const size = Math.ceil(rows.length / columns)
  const chunks: T[][] = []
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size))
  }
  return chunks
}

type AllTimeHighsYearTableProps = {
  allTimeHighs: AllTimeHighs
  fundName: string
}

export function AllTimeHighsYearTable({ allTimeHighs, fundName }: AllTimeHighsYearTableProps) {
  const columns = useMemo(
    () => chunkYears(allTimeHighs.yearlyMaxLevels, 3),
    [allTimeHighs.yearlyMaxLevels],
  )

  if (columns.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          All-time highs are a natural part of any growing fund
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Calendar-year maximum NAV for {fundName}. Green rows mark years that set a fresh peak.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((column, columnIndex) => (
          <ScrollTable key={columnIndex} minWidth={220} className={APP_TABLE_SHELL}>
            <table className="w-full border-collapse text-[11px] leading-snug sm:text-xs md:text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className={appTableHeadCell()}>Calendar Year</th>
                  <th className={appTableHeadCell('text-right')}>Max NAV</th>
                </tr>
              </thead>
              <tbody>
                {column.map((row) => (
                  <tr
                    key={row.year}
                    className={cn(row.allTimeHighYear && 'bg-emerald-100/90 dark:bg-emerald-950/40')}
                  >
                    <td className={appTableBodyCell()}>{row.yearLabel}</td>
                    <td className={appTableBodyCell('text-right font-mono')}>
                      {row.maxNav.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="inline-block size-4 rounded-sm bg-emerald-500/80" aria-hidden="true" />
          <span>Green cells indicate All Time High years</span>
        </div>
      </div>
    </div>
  )
}
