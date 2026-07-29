import { ScrollTable } from '@/components/ui/scroll-table'
import { cn } from '@/lib/utils'
import {
  fiBodyCell,
  fiMultiplyHeaderCell,
  fiStickyLabelCell,
  FI_TABLE,
} from '@/components/fundsindia/tableStyles'
import type { MultiplyProbabilityTable } from '../../lib/matrix/multiplyProbability'
import { isCellHighlighted } from '../../lib/matrix/multiplyProbability'
import { buildMultiplyHeadline, shortFundName } from '../../lib/headlines/sectionHeadlines'
import { SectionHeadline } from '../layout/StatHeadline'

export function MultiplyProbabilityTable({
  table,
  fundName,
  benchmarkName,
}: {
  table: MultiplyProbabilityTable
  fundName: string
  benchmarkName?: string
}) {
  if (table.holdingYears.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Need at least 5 years of history to show multiply probability.
      </p>
    )
  }

  const title = benchmarkName ? `${fundName} vs ${benchmarkName}` : fundName

  return (
    <div className="space-y-4">
      <SectionHeadline headline={buildMultiplyHeadline(table, fundName)} />

      <ScrollTable minWidth={720} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th colSpan={table.holdingYears.length + 1} className={fiMultiplyHeaderCell('text-left text-sm normal-case')}>
                {title} — % times multiplied over years
                {table.periodLabel ? (
                  <span className="mt-1 block text-xs font-normal opacity-80">{table.periodLabel}</span>
                ) : null}
              </th>
            </tr>
            <tr>
              <th className={fiMultiplyHeaderCell(fiStickyLabelCell('normal-case z-20'))}>Multiply</th>
              {table.holdingYears.map((y) => (
                <th key={y} className={fiMultiplyHeaderCell()}>
                  {y} Year
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={row.multiply} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50/80 dark:bg-muted/20'}>
                <td className={fiBodyCell(fiStickyLabelCell('font-semibold'))}>{row.multiply} times</td>
                {row.cells.map((cell) => {
                  const highlighted = isCellHighlighted(row, cell.holdingYears)
                  return (
                    <td
                      key={cell.holdingYears}
                      title={
                        cell.sampleCount != null
                          ? `${cell.hitCount ?? 0} of ${cell.sampleCount} rolling windows`
                          : undefined
                      }
                      className={cn(
                        fiBodyCell('font-medium'),
                        highlighted && 'ring-2 ring-inset ring-sky-400/90 ring-offset-1',
                      )}
                    >
                      {cell.percent == null ? '—' : `${Math.round(cell.percent)}%`}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>

      <div className="grid gap-3 md:grid-cols-3">
        {table.rows
          .filter((r) => r.calloutPercent != null && r.highlightYears)
          .slice(0, 3)
          .map((row) => (
            <div
              key={row.multiply}
              className="rounded-xl border-2 border-dashed border-[var(--headline-rule)] bg-[var(--headline-surface)] px-4 py-3 text-sm font-semibold leading-relaxed text-headline-ink sm:text-base"
            >
              <span className="text-headline-accent">
                {Math.round(row.calloutPercent!)}% of the times
              </span>{' '}
              {shortFundName(fundName)} reached{' '}
              <span className="text-headline-accent">{row.multiply}x</span> in{' '}
              <span className="text-headline-accent">
                {row.highlightYears![0]}-{row.highlightYears![1]} years
              </span>
              .
            </div>
          ))}
      </div>
    </div>
  )
}
