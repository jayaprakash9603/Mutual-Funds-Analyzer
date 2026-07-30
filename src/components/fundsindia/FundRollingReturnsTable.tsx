import { fiHeaderCell, fiSubHeaderCell, FI_GRID } from '@/components/fundsindia/tableStyles'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { MATRIX_PERIODS } from '@/lib/constants'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReport } from '@/features/fund-report/schemas'

type RollingReturns = FundReport['rollingReturns']

const FUND_COLOR = CHART_COLORS.fund
const DATA_CELL = cn('border px-3 py-2.5 text-center tabular-nums', FI_GRID)
const YEAR_CELL = cn(
  'sticky left-0 z-10 min-w-[96px] border-r px-3 py-2.5 align-middle text-center font-bold',
  FI_GRID,
)
const SCHEME_CELL = cn('min-w-[220px] border-r px-3 py-2.5 align-middle text-left', FI_GRID)

interface FundRollingReturnsTableProps {
  rollingReturns: RollingReturns
  fundName: string
  dataTo?: string
}

export function FundRollingReturnsTable({
  rollingReturns,
  fundName,
  dataTo,
}: FundRollingReturnsTableProps) {
  const periodByLabel = new Map(
    rollingReturns.periods.map((period) => [period.periodLabel, period]),
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-brand/30 bg-brand px-4 py-3 sm:px-6">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white">Key Parameters</h2>
      </div>
      <div className="border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
            style={{ backgroundColor: FUND_COLOR }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fund</p>
            <p className="break-words text-sm font-medium leading-snug text-emerald-800 dark:text-emerald-300" title={fundName}>
              {fundName}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-border/60 px-4 py-2 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Fund rolling returns from daily NAV (mfapi.in)
          {dataTo ? ` · data to ${dataTo.slice(0, 10)}` : ''}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className={cn(
                  'sticky left-0 z-20 min-w-[96px] border-r border-white/25',
                  fiHeaderCell(),
                )}
              >
                Year
              </th>
              <th
                rowSpan={2}
                className={cn('min-w-[220px] border-r border-white/25 text-left', fiHeaderCell())}
              >
                Fund
              </th>
              <th colSpan={4} className={cn('border border-white/20', fiHeaderCell())}>
                Key Parameters
              </th>
              <th rowSpan={2} className={cn('border border-white/20', fiHeaderCell())}>
                &gt; 10%
              </th>
              <th rowSpan={2} className={cn('border border-white/20', fiHeaderCell())}>
                Total Records
              </th>
            </tr>
            <tr>
              <th className={cn('border border-white/15', fiSubHeaderCell())}>AVG</th>
              <th className={cn('border border-white/15', fiSubHeaderCell())}>MAX</th>
              <th className={cn('border border-white/15', fiSubHeaderCell())}>MIN</th>
              <th className={cn('border border-white/15', fiSubHeaderCell())}>STD</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX_PERIODS.map((periodLabel, index) => {
              const row = periodByLabel.get(periodLabel)
              const stripe = index % 2 === 0 ? 'bg-card' : 'bg-muted/20'

              if (!row) {
                return (
                  <tr key={periodLabel} className={stripe}>
                    <td className={cn(YEAR_CELL, stripe)}>{periodLabel}</td>
                    <td colSpan={7} className={cn(DATA_CELL, 'text-left text-muted-foreground')}>
                      Insufficient NAV history for this window
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={periodLabel} className={cn(stripe, 'border-b-2 border-border')}>
                  <td className={cn(YEAR_CELL, stripe, 'text-foreground')}>{periodLabel}</td>
                  <td className={cn(SCHEME_CELL, stripe)}>
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: FUND_COLOR }}
                        aria-hidden="true"
                      />
                      <p
                        className="break-words text-sm font-medium leading-snug text-emerald-800 dark:text-emerald-300"
                        title={fundName}
                      >
                        {fundName}
                      </p>
                    </div>
                  </td>
                  <td className={cn(DATA_CELL, 'font-semibold')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.average)}
                  </td>
                  <td className={cn(DATA_CELL, 'font-medium')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.maximum)}
                  </td>
                  <td className={cn(DATA_CELL, 'font-medium')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.minimum)}
                  </td>
                  <td className={cn(DATA_CELL, 'font-medium')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.stdDev)}
                  </td>
                  <td className={cn(DATA_CELL, 'font-bold text-brand')}>
                    {formatPercent(row.percentAbove10)}
                  </td>
                  <td className={cn(DATA_CELL, 'font-bold')}>
                    {row.count.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 px-6 py-3 text-sm text-muted-foreground">
        Consistency score:{' '}
        <strong className="font-semibold text-brand">
          {rollingReturns.consistencyScore.toFixed(0)}/100
        </strong>
      </div>
    </div>
  )
}
