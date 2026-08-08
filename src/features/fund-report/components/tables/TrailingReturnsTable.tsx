import {
  fiBodyCell,
  fiHeaderCell,
  fiSubHeaderCell,
  fiStickyStripeBg,
  FI_TABLE,
} from '@/components/fundsindia/tableStyles'
import { ScrollTable } from '@/components/ui/scroll-table'
import { AppTableShell } from '@/components/ui/AppTableShell'
import { CHART_COLORS, signedReturnColor } from '@/lib/charts/chartColors'
import { shortPeriodLabel } from '@/lib/funds/shortPeriodLabel'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReport } from '../../schemas'

type TrailingPeriod = FundReport['trailingReturns']['periods'][number]

interface TrailingReturnsTableProps {
  periods: TrailingPeriod[]
  fundName: string
}

/** Opaque first-column pane — scrollbar lives only under the metrics table. */
function PeriodColumn({
  periods,
  compact,
}: {
  periods: TrailingPeriod[]
  compact: boolean
}) {
  return (
    <table className={FI_TABLE}>
      <thead>
        <tr>
          <th
            className={cn(
              fiHeaderCell(),
              'whitespace-nowrap text-left normal-case',
              compact ? 'min-w-[2.75rem] px-1.5' : 'min-w-[6.5rem]',
            )}
          >
            {compact ? 'Per.' : 'Period'}
          </th>
        </tr>
        <tr>
          <th className={fiSubHeaderCell(compact ? 'px-1.5' : undefined)} aria-hidden="true">
            &nbsp;
          </th>
        </tr>
      </thead>
      <tbody>
        {periods.map((period, index) => (
          <tr key={period.label} className={fiStickyStripeBg(index)}>
            <td
              className={cn(
                fiBodyCell('font-semibold'),
                fiStickyStripeBg(index),
                'whitespace-nowrap text-left',
                compact && 'px-1.5 text-[11px]',
              )}
              title={period.label}
            >
              {shortPeriodLabel(period.label, compact)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function TrailingReturnsTable({ periods, fundName }: TrailingReturnsTableProps) {
  const isSmall = useIsSmallScreen()

  if (periods.length === 0) {
    return <p className="text-xs text-muted-foreground sm:text-sm">No trailing return periods available.</p>
  }

  return (
    <AppTableShell
      title="Returns Dashboard"
      subtitle={fundName}
      meta="Absolute return, CAGR, growth of ₹10,000, and money multiplier by holding period."
    >
      <ScrollTable
        pinnedLeading={<PeriodColumn periods={periods} compact={isSmall} />}
        minWidth={isSmall ? 320 : 480}
      >
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th colSpan={4} className={fiHeaderCell()}>
                Key Parameters
              </th>
            </tr>
            <tr>
              <th className={fiSubHeaderCell()}>{isSmall ? 'Abs' : 'Absolute'}</th>
              <th className={fiSubHeaderCell()}>CAGR</th>
              <th className={fiSubHeaderCell()}>{isSmall ? '₹10k' : '₹10k →'}</th>
              <th className={fiSubHeaderCell()}>{isSmall ? 'Mult' : 'Multiplier'}</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period, index) => (
              <tr key={period.label} className={fiStickyStripeBg(index)}>
                <td
                  className={fiBodyCell('font-semibold')}
                  style={{ color: signedReturnColor(period.absoluteReturn) }}
                >
                  {formatPercent(period.absoluteReturn)}
                </td>
                <td
                  className={fiBodyCell('font-semibold')}
                  style={{ color: signedReturnColor(period.cagr) }}
                >
                  {formatPercent(period.cagr)}
                </td>
                <td className={fiBodyCell('font-mono font-semibold')}>
                  ₹{period.growthOfTenThousand.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td
                  className={fiBodyCell('font-semibold')}
                  style={{
                    color: period.moneyMultiplied >= 1 ? CHART_COLORS.fund : CHART_COLORS.red,
                  }}
                >
                  {period.moneyMultiplied.toFixed(2)}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    </AppTableShell>
  )
}
