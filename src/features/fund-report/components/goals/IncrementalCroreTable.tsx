import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { fiBodyCell, fiMultiplyHeaderCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { buildIncrementalCroreJourney } from '../../lib/goals/incrementalCrore'

export function IncrementalCroreTable({ cagrPercent }: { cagrPercent: number }) {
  const rows = useMemo(() => buildIncrementalCroreJourney(cagrPercent), [cagrPercent])

  return (
    <ScrollTable minWidth={520} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell()}>Journey</th>
            <th className={fiMultiplyHeaderCell()}>Return required</th>
            <th className={fiMultiplyHeaderCell()}>Time required</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fromLabel}>
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
