import {
  fiBodyCell,
  fiHeaderCell,
  fiSubHeaderCell,
  fiStickyStripeBg,
  FI_TABLE,
} from '@/components/fundsindia/tableStyles'
import { ScrollTable } from '@/components/ui/scroll-table'
import { CHART_COLORS, signedReturnColor } from '@/lib/charts/chartColors'
import { APP_TABLE_MIN_WIDTH } from '@/lib/ui/appTableStyles'
import { AppTableShell } from '@/components/ui/AppTableShell'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReport } from '../../schemas'

type TrailingPeriod = FundReport['trailingReturns']['periods'][number]

interface TrailingReturnsTableProps {
  periods: TrailingPeriod[]
  fundName: string
}

const PERIOD_COL =
  'min-w-[7.5rem] px-2 py-2 text-left text-[11px] font-semibold sm:min-w-[8.5rem] sm:px-2.5 sm:text-xs md:min-w-[10rem] md:px-3 md:text-sm'

/** Matches stacked Key Parameters header (title row + sub-header row). */
const PINNED_HEAD_HEIGHT =
  'h-[4.75rem] sm:h-[5.25rem] md:h-[5.75rem]'

export function TrailingReturnsTable({ periods, fundName }: TrailingReturnsTableProps) {
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
        minWidth={APP_TABLE_MIN_WIDTH.md}
        pinnedLeading={
          <table className={FI_TABLE}>
            <thead>
              <tr>
                <th
                  className={cn(
                    fiHeaderCell(),
                    PERIOD_COL,
                    PINNED_HEAD_HEIGHT,
                    'align-middle normal-case',
                  )}
                >
                  Period
                </th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => (
                <tr key={period.label} className={fiStickyStripeBg(index)}>
                  <td className={cn(fiBodyCell(), PERIOD_COL, fiStickyStripeBg(index), 'font-semibold')}>
                    {period.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th colSpan={4} className={fiHeaderCell()}>
                Key Parameters
              </th>
            </tr>
            <tr>
              <th className={fiSubHeaderCell()}>Absolute</th>
              <th className={fiSubHeaderCell()}>CAGR</th>
              <th className={fiSubHeaderCell()}>₹10k →</th>
              <th className={fiSubHeaderCell()}>Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period, index) => (
              <tr key={period.label} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/20')}>
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
