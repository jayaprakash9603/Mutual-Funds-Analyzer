import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { cn } from '@/lib/utils'
import { fiBodyCell, fiMultiplyHeaderCell, fiStickyLabelCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { buildRequiredCagrGrid } from '../../lib/goals/requiredCagr'

export function RequiredCagrGrid() {
  const grid = useMemo(() => buildRequiredCagrGrid(), [])

  return (
    <ScrollTable minWidth={960} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell(fiStickyLabelCell('normal-case z-20'))}>Multiple</th>
            {grid.horizonsYears.map((years) => (
              <th key={years} className={fiMultiplyHeaderCell()}>
                {years}Y
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, rowIndex) => (
            <tr key={grid.multiples[rowIndex]}>
              <td className={fiBodyCell(fiStickyLabelCell('font-semibold'))}>{grid.multiples[rowIndex]}x</td>
              {row.map((cell) => (
                <td
                  key={`${cell.multiple}-${cell.years}`}
                  className={cn(
                    fiBodyCell('tabular-nums'),
                    cell.cagrPercent > 30 && 'bg-muted/50 text-muted-foreground',
                  )}
                >
                  {cell.cagrPercent.toFixed(1)}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}
