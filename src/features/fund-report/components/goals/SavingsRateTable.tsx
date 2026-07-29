import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { fiBodyCell, fiMultiplyHeaderCell, fiStickyLabelCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { buildSavingsRateGrid } from '../../lib/goals/savingsRate'

export function SavingsRateTable({ cagrPercent }: { cagrPercent: number }) {
  const grid = useMemo(() => buildSavingsRateGrid(5, cagrPercent), [cagrPercent])

  return (
    <ScrollTable minWidth={960} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell(fiStickyLabelCell('normal-case z-20'))}>Savings rate</th>
            {grid.horizonsYears.map((years) => (
              <th key={years} className={fiMultiplyHeaderCell()}>
                {years}Y
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, rowIndex) => (
            <tr key={grid.savingsRatesPercent[rowIndex]}>
              <td className={fiBodyCell(fiStickyLabelCell('font-semibold'))}>
                {grid.savingsRatesPercent[rowIndex]}%
              </td>
              {row.map((cell) => (
                <td key={`${cell.savingsRatePercent}-${cell.horizonYears}`} className={fiBodyCell('tabular-nums')}>
                  {cell.expenseMultiple.toFixed(1)}x
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}
