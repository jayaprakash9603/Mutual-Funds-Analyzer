import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { fiBodyCell, fiMultiplyHeaderCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { buildIncrementalCroreJourney } from '../../lib/goals/incrementalCrore'
import { GOAL_TABLE_SHELL, goalRowStripe } from './goalTableStyles'

export function IncrementalCroreTable({ cagrPercent }: { cagrPercent: number }) {
  const rows = useMemo(() => buildIncrementalCroreJourney(cagrPercent), [cagrPercent])

  return (
    <ScrollTable minWidth={520} className={GOAL_TABLE_SHELL}>
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell()}>Journey</th>
            <th className={fiMultiplyHeaderCell()}>Return required</th>
            <th className={fiMultiplyHeaderCell()}>Time required</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.fromLabel} className={goalRowStripe(rowIndex)}>
              <td className={fiBodyCell()}>
                {row.fromLabel} → {row.toLabel}
              </td>
              <td className={fiBodyCell()}>{row.returnRequiredPercent.toFixed(0)}%</td>
              <td className={fiBodyCell()}>{row.yearsRequired.toFixed(1)} yrs</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}
