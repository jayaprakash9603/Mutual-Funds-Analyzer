import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { fiBodyCell, fiMultiplyHeaderCell, fiStickyLabelCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { buildTargetAmountGrid } from '../../lib/goals/targetAmountPlanner'

function formatRupees(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(value % 1_00_00_000 === 0 ? 0 : 1)}Cr`
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(0)}L`
  return `₹${value.toLocaleString('en-IN')}`
}

export function TargetAmountTable({
  cagrPercent,
  stepUpPercent,
}: {
  cagrPercent: number
  stepUpPercent: number
}) {
  const grid = useMemo(
    () => buildTargetAmountGrid(cagrPercent, stepUpPercent),
    [cagrPercent, stepUpPercent],
  )

  return (
    <ScrollTable minWidth={720} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell(fiStickyLabelCell('normal-case z-20'))}>
              SIP ({stepUpPercent}% step-up)
            </th>
            {grid.targetAmounts.map((target) => (
              <th key={target} className={fiMultiplyHeaderCell()}>
                {formatRupees(target)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.sipAmounts.map((sip, rowIndex) => (
            <tr key={sip}>
              <td className={fiBodyCell(fiStickyLabelCell('font-semibold'))}>{formatRupees(sip)}/mo</td>
              {grid.rows[rowIndex]?.map((cell, cellIndex) => (
                <td key={`${sip}-${grid.targetAmounts[cellIndex]}`} className={fiBodyCell()}>
                  {cell.duration}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}
