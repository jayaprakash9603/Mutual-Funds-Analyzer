import { cn } from '@/lib/utils'
import {
  fiBodyCell,
  fiMultiplyHeaderCell,
  FI_TABLE,
} from '@/components/fundsindia/tableStyles'
import type { MatrixReport } from '../schemas'
import { buildMultiplyProbability, isCellHighlighted } from '../lib/multiplyProbability'
import { trimMatrixToCalculatedValues } from '../lib/matrixTableUtils'

export function MultiplyProbabilityTable({
  matrix,
  fundName,
  benchmarkName,
}: {
  matrix: MatrixReport
  fundName: string
  benchmarkName?: string
}) {
  const table = buildMultiplyProbability(trimMatrixToCalculatedValues(matrix), benchmarkName)
  if (table.holdingYears.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Need at least 5 years of history to show multiply probability.
      </p>
    )
  }

  const title = benchmarkName
    ? `${fundName} vs ${benchmarkName}`
    : fundName

  return (
    <div className="space-y-4">
      <p className="text-base font-semibold leading-snug text-brand">{table.headline}</p>

      <div className="overflow-x-auto rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th colSpan={table.holdingYears.length + 1} className={fiMultiplyHeaderCell('text-left text-sm normal-case')}>
                {title} — % times multiplied over years
              </th>
            </tr>
            <tr>
              <th className={fiMultiplyHeaderCell('text-left')}>Multiply</th>
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
                <td className={fiBodyCell('text-left font-semibold')}>{row.multiply} times</td>
                {row.cells.map((cell) => {
                  const highlighted = isCellHighlighted(row, cell.holdingYears)
                  return (
                    <td
                      key={cell.holdingYears}
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
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {table.rows
          .filter((r) => r.calloutPercent != null && r.highlightYears)
          .slice(0, 3)
          .map((row) => (
            <div
              key={row.multiply}
              className="rounded-xl border border-dashed border-slate-400/70 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed dark:border-slate-600 dark:bg-muted/20"
            >
              <span className="font-bold text-brand">{Math.round(row.calloutPercent!)}%</span>
              {' of the times '}
              {fundName} reached{' '}
              <strong>{row.multiply}x</strong> in{' '}
              <strong>
                {row.highlightYears![0]}-{row.highlightYears![1]} years
              </strong>
              .
            </div>
          ))}
      </div>
    </div>
  )
}
