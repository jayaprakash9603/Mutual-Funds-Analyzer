import {
  fiBodyCell,
  fiHeaderCell,
  fiSubHeaderCell,
  fiStickyLabelCell,
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
      <ScrollTable minWidth={APP_TABLE_MIN_WIDTH.md}>
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className={cn(
                  fiHeaderCell(),
                  fiStickyLabelCell('z-30 bg-brand text-left normal-case text-white shadow-[4px_0_10px_-4px_rgba(0,0,0,0.35)]'),
                )}
              >
                Period
              </th>
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
              <tr key={period.label} className={fiStickyStripeBg(index)}>
                <td
                  className={cn(
                    fiBodyCell(),
                    fiStickyLabelCell('z-20 font-semibold'),
                    fiStickyStripeBg(index),
                  )}
                >
                  {period.label}
                </td>
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
