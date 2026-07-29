import { ScrollTable } from '@/components/ui/scroll-table'
import { fiBodyCell, fiMultiplyHeaderCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'

type ThresholdRecovery = FundReportRisk['drawdown']['thresholdRecoveries'][number]

export function ThresholdRecoveryTable({
  recoveries,
}: {
  recoveries: ThresholdRecovery[]
}) {
  if (recoveries.length === 0) {
    return null
  }

  return (
    <ScrollTable minWidth={720} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell()}>Threshold</th>
            <th className={fiMultiplyHeaderCell()}>#</th>
            <th className={fiMultiplyHeaderCell()}>Cross date</th>
            <th className={fiMultiplyHeaderCell()}>Recovery</th>
            <th className={fiMultiplyHeaderCell()}>Duration</th>
            <th className={fiMultiplyHeaderCell()}>Return</th>
          </tr>
        </thead>
        <tbody>
          {recoveries.map((row) => (
            <tr key={`${row.thresholdPercent}-${row.sequence}-${row.crossDate}`}>
              <td className={fiBodyCell()}>{Math.abs(row.thresholdPercent)}%</td>
              <td className={fiBodyCell()}>{row.sequence}</td>
              <td className={fiBodyCell()}>{row.crossDate}</td>
              <td className={fiBodyCell()}>{row.recovered ? row.recoveryDate : 'Ongoing'}</td>
              <td className={fiBodyCell()}>{row.recoveryDurationLabel}</td>
              <td className={fiBodyCell()}>
                {formatPercent(row.returnPercent, 0)}
                {row.usesCagr ? ' (CAGR)' : ' (Absolute)'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}
