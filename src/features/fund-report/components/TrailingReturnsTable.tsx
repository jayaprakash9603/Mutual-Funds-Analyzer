import { fiBodyCell, fiHeaderCell, fiSubHeaderCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { CHART_COLORS, signedReturnColor } from '@/lib/chartColors'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReport } from '../schemas'

type TrailingPeriod = FundReport['trailingReturns']['periods'][number]

interface TrailingReturnsTableProps {
  periods: TrailingPeriod[]
  fundName: string
}

export function TrailingReturnsTable({ periods, fundName }: TrailingReturnsTableProps) {
  if (periods.length === 0) {
    return <p className="text-sm text-muted-foreground">No trailing return periods available.</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <div className="border-b border-brand/30 bg-brand px-6 py-3">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white">Returns Dashboard</h2>
        <p className="mt-1 truncate text-sm text-white/90" title={fundName}>
          {fundName}
        </p>
      </div>

      <div className="border-b border-border/60 bg-muted/20 px-6 py-2">
        <p className="text-sm text-muted-foreground">
          Absolute return, CAGR, growth of ₹10,000, and money multiplier by holding period.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className={cn(FI_TABLE, 'min-w-[720px]')}>
          <thead>
            <tr>
              <th rowSpan={2} className={cn(fiHeaderCell('sticky left-0 z-20 text-left'), 'min-w-[140px]')}>
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
              <tr
                key={period.label}
                className={cn(
                  index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50/80 dark:bg-muted/20',
                )}
              >
                <td className={cn(fiBodyCell('sticky left-0 z-10 bg-inherit text-left font-semibold'))}>
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
      </div>
    </div>
  )
}
