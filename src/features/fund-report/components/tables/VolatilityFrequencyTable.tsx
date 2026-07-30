import type { FundReportRisk } from '../../schemas'
import { ScrollTable } from '@/components/ui/scroll-table'
import { INSIDE_CARD_TABLE_CLASS } from '@/lib/charts/chartSurface'
import {
  FI_TABLE,
  fiBodyCell,
  fiHeaderCell,
  fiStickyLabelCell,
} from '@/components/fundsindia/tableStyles'
import { formatPercent } from '@/lib/utils'

type Volatility = FundReportRisk['volatility']

export function VolatilityFrequencyTable({
  volatility,
  benchmarkName = 'Benchmark',
}: {
  volatility: Volatility
  benchmarkName?: string
}) {
  if (volatility.periods.length === 0) {
    return <p className="text-sm text-muted-foreground">No volatility frequency data available.</p>
  }

  return (
    <ScrollTable minWidth={720} className={INSIDE_CARD_TABLE_CLASS}>
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiHeaderCell(fiStickyLabelCell('normal-case z-20'))}>Frequency</th>
            <th className={fiHeaderCell()}>Observations</th>
            <th className={fiHeaderCell()}>Annualised vol</th>
            {volatility.benchmarkAvailable ? (
              <th className={fiHeaderCell()}>{benchmarkName} vol</th>
            ) : null}
            <th className={fiHeaderCell()}>Typical swing</th>
            <th className={fiHeaderCell()}>Best move</th>
            <th className={fiHeaderCell()}>Worst move</th>
            <th className={fiHeaderCell()}>% positive</th>
          </tr>
        </thead>
        <tbody>
          {volatility.periods.map((period) => (
            <tr key={period.frequency}>
              <td className={fiBodyCell(fiStickyLabelCell('font-medium'))}>{period.frequency}</td>
              <td className={fiBodyCell()}>{period.observations.toLocaleString('en-IN')}</td>
              <td className={fiBodyCell()}>{formatPercent(period.annualisedVolatilityPercent, 1)}</td>
              {volatility.benchmarkAvailable ? (
                <td className={fiBodyCell()}>
                  {formatPercent(period.benchmarkAnnualisedVolatilityPercent, 1)}
                </td>
              ) : null}
              <td className={fiBodyCell()}>{formatPercent(period.typicalSwingPercent, 2)}</td>
              <td className={fiBodyCell()}>
                {formatPercent(period.bestReturnPercent, 1)}
                <span className="block text-xs text-muted-foreground">{period.bestReturnDate}</span>
              </td>
              <td className={fiBodyCell()}>
                {formatPercent(period.worstReturnPercent, 1)}
                <span className="block text-xs text-muted-foreground">{period.worstReturnDate}</span>
              </td>
              <td className={fiBodyCell()}>{formatPercent(period.positivePeriodsPercent, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}
