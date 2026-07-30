import { ScrollTable } from '@/components/ui/scroll-table'
import { fiBodyCell, fiHeaderCell, fiStickyLabelCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { APP_TABLE_MIN_WIDTH, APP_TABLE_SHELL } from '@/lib/ui/appTableStyles'
import { cn } from '@/lib/utils'
import type { MatrixReport } from '../../schemas'
import {
  cellFillStyle,
  computeColumnMinimums,
  findContiguousLabelRanges,
  formatMatrixValue,
  isColumnMinimum,
} from '../../lib/matrix/matrixTableUtils'

interface FundsIndiaMatrixTableProps {
  data: MatrixReport
  /** Row labels to softly highlight (e.g. all below-baseline starts). */
  highlightLabels?: Set<string>
  /** Row labels grouped with a dashed blue outline (e.g. never-recovered exceptions). */
  dashedHighlightLabels?: Set<string>
  className?: string
}

const matrixLabelCell = 'w-px whitespace-nowrap px-1 py-1.5 sm:px-2 sm:py-2'

export function FundsIndiaMatrixTable({
  data,
  highlightLabels,
  dashedHighlightLabels,
  className,
}: FundsIndiaMatrixTableProps) {
  const columnMins = computeColumnMinimums(data.dataRows, data.holdingYears.length)
  const dashedLabels = dashedHighlightLabels ?? new Set<string>()
  const highlightRanges = dashedLabels.size > 0
    ? findContiguousLabelRanges([...dashedLabels], data.dataRows.map((row) => row.startLabel))
    : []

  return (
    <ScrollTable
      minWidth={APP_TABLE_MIN_WIDTH.xl}
      className={cn(APP_TABLE_SHELL, className)}
    >
      <table className={FI_TABLE}>
        <tbody>
          {data.summaryRows.map((row) => (
            <tr key={row.label} className="border-b border-slate-900/80">
              <td className={cn(fiBodyCell(fiStickyLabelCell('font-bold')), matrixLabelCell)}>
                {row.label}
              </td>
              {row.values.map((value, index) => (
                <td
                  key={`${row.label}-${index}`}
                  className={cn(
                    fiBodyCell('font-bold'),
                    row.label === 'Max' && 'text-emerald-800 dark:text-emerald-300',
                    row.label === 'Min' && 'text-orange-700 dark:text-orange-300',
                  )}
                >
                  {value == null ? '—' : formatMatrixValue(data.mode, value)}
                </td>
              ))}
            </tr>
          ))}

          <tr className="border-b border-slate-900/80">
            <td className={cn(fiHeaderCell(fiStickyLabelCell('z-20 normal-case')), matrixLabelCell)}>
              Period
            </td>
            {data.holdingYears.map((year) => (
              <td key={year} className={fiHeaderCell()}>
                {year}
              </td>
            ))}
          </tr>

          {data.dataRows.map((row, rowIndex) => {
            const highlighted = highlightLabels?.has(row.startLabel) ?? false
            const inDashedRange = highlightRanges.some(
              (range) => rowIndex >= range.start && rowIndex <= range.end,
            )
            const rangeStart = highlightRanges.some((range) => rowIndex === range.start)
            const rangeEnd = highlightRanges.some((range) => rowIndex === range.end)

            return (
              <tr key={row.startLabel} className="border-b border-slate-900/80">
                <td
                  className={cn(
                    fiBodyCell(fiStickyLabelCell('font-semibold')),
                    matrixLabelCell,
                    highlighted && 'bg-sky-50 dark:bg-sky-950/30',
                    inDashedRange && 'border-l-2 border-dashed border-sky-600',
                    rangeStart && 'border-t-2 border-dashed border-sky-600',
                    rangeEnd && 'border-b-2 border-dashed border-sky-600',
                  )}
                >
                  {row.startLabel}
                </td>
                {row.cells.map((cell, columnIndex) => {
                  const hasValue = cell.value != null
                  const columnMin = isColumnMinimum(cell.value, columnMins[columnIndex])
                  const fill = hasValue ? cellFillStyle(cell.band, columnMin) : undefined
                  const lastColumn = columnIndex === row.cells.length - 1

                  return (
                    <td
                      key={cell.holdingYears}
                      className={cn(
                        fiBodyCell('font-semibold'),
                        !hasValue && 'bg-background',
                        inDashedRange && 'border-l border-dashed border-sky-600/70',
                        rangeStart && 'border-t border-dashed border-sky-600/70',
                        rangeEnd && 'border-b border-dashed border-sky-600/70',
                        lastColumn && inDashedRange && 'border-r-2 border-dashed border-sky-600',
                      )}
                      style={fill}
                    >
                      {hasValue ? formatMatrixValue(data.mode, cell.value!) : ''}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollTable>
  )
}
