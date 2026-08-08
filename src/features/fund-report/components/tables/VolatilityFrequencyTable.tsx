import type { FundReportRisk } from '../../schemas'
import { ScrollTable } from '@/components/ui/scroll-table'
import { INSIDE_CARD_TABLE_CLASS } from '@/lib/charts/chartSurface'
import {
  FI_TABLE,
  fiBodyCell,
  fiHeaderCell,
  fiStickyStripeBg,
} from '@/components/fundsindia/tableStyles'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { cn, formatPercent } from '@/lib/utils'

type Volatility = FundReportRisk['volatility']

const FREQ_COL =
  'min-w-[3.5rem] max-w-[5rem] text-left align-middle font-medium sm:min-w-[5.5rem] sm:max-w-none'

function shortFrequency(label: string, compact: boolean): string {
  if (!compact) return label
  if (/^daily$/i.test(label)) return 'Day'
  if (/^weekly$/i.test(label)) return 'Wk'
  if (/^monthly$/i.test(label)) return 'Mo'
  if (/^quarterly$/i.test(label)) return 'Qtr'
  return label
}

export function VolatilityFrequencyTable({
  volatility,
  benchmarkName = 'Benchmark',
}: {
  volatility: Volatility
  benchmarkName?: string
}) {
  const isSmall = useIsSmallScreen()

  if (volatility.periods.length === 0) {
    return <p className="text-sm text-muted-foreground">No volatility frequency data available.</p>
  }

  const frequencyPane = (
    <table className={cn(FI_TABLE, 'bg-card')}>
      <thead>
        <tr>
          <th className={cn(fiHeaderCell(), FREQ_COL, 'normal-case')}>
            {isSmall ? 'Freq' : 'Frequency'}
          </th>
        </tr>
      </thead>
      <tbody>
        {volatility.periods.map((period, index) => (
          <tr key={period.frequency} className={fiStickyStripeBg(index)}>
            <td
              className={cn(fiBodyCell(), FREQ_COL, fiStickyStripeBg(index))}
              title={period.frequency}
            >
              {shortFrequency(period.frequency, isSmall)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <ScrollTable
      pinnedLeading={frequencyPane}
      minWidth={isSmall ? 420 : 560}
      className={INSIDE_CARD_TABLE_CLASS}
    >
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiHeaderCell()}>{isSmall ? 'Obs' : 'Observations'}</th>
            <th className={fiHeaderCell()}>{isSmall ? 'Vol' : 'Annualised vol'}</th>
            {volatility.benchmarkAvailable ? (
              <th className={fiHeaderCell()}>{isSmall ? 'Bmk' : `${benchmarkName} vol`}</th>
            ) : null}
            <th className={fiHeaderCell()}>{isSmall ? 'Swing' : 'Typical swing'}</th>
            <th className={fiHeaderCell()}>Best</th>
            <th className={fiHeaderCell()}>Worst</th>
            <th className={fiHeaderCell()}>{isSmall ? '+%' : '% positive'}</th>
          </tr>
        </thead>
        <tbody>
          {volatility.periods.map((period, index) => (
            <tr key={period.frequency} className={fiStickyStripeBg(index)}>
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
                {!isSmall ? (
                  <span className="block text-[10px] text-muted-foreground sm:text-xs">
                    {period.bestReturnDate}
                  </span>
                ) : null}
              </td>
              <td className={fiBodyCell()}>
                {formatPercent(period.worstReturnPercent, 1)}
                {!isSmall ? (
                  <span className="block text-[10px] text-muted-foreground sm:text-xs">
                    {period.worstReturnDate}
                  </span>
                ) : null}
              </td>
              <td className={fiBodyCell()}>{formatPercent(period.positivePeriodsPercent, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}
