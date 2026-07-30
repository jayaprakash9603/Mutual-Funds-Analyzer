import {
  fiHeaderCell,
  fiSubHeaderCell,
  fiMatrixDataCell,
  fiMatrixSchemeCell,
  fiMatrixYearCell,
  FI_TABLE,
} from '@/components/fundsindia/tableStyles'
import { ScrollTable } from '@/components/ui/scroll-table'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { MATRIX_PERIODS } from '@/lib/constants'
import {
  APP_TABLE_MIN_WIDTH,
  APP_TABLE_SHELL,
  APP_TABLE_SHELL_FOOTER,
  APP_TABLE_SHELL_HEADER,
  APP_TABLE_SHELL_META,
  APP_TABLE_SHELL_TITLE,
} from '@/lib/ui/appTableStyles'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReport } from '@/features/fund-report/schemas'

type RollingReturns = FundReport['rollingReturns']

const FUND_COLOR = CHART_COLORS.fund

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
    <div className={APP_TABLE_SHELL}>
      <div className={APP_TABLE_SHELL_HEADER}>
        <h2 className={APP_TABLE_SHELL_TITLE}>Key Parameters</h2>
      </div>
      <div className="border-b border-border/60 bg-muted/20 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
        <div className="flex min-w-0 items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2">
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full ring-2 ring-background sm:mt-1.5 sm:h-2.5 sm:w-2.5"
            style={{ backgroundColor: FUND_COLOR }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
              Fund
            </p>
            <p
              className="break-words text-xs font-medium leading-snug text-emerald-800 dark:text-emerald-300 sm:text-sm"
              title={fundName}
            >
              {fundName}
            </p>
          </div>
        </div>
      </div>

      <div className={APP_TABLE_SHELL_META}>
        Fund rolling returns from daily NAV (mfapi.in)
        {dataTo ? ` · data to ${dataTo.slice(0, 10)}` : ''}
      </div>

      <ScrollTable minWidth={APP_TABLE_MIN_WIDTH.xl}>
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className={cn('sticky left-0 z-20 border-r border-white/25', fiHeaderCell(), fiMatrixYearCell())}
              >
                Year
              </th>
              <th rowSpan={2} className={cn('border-r border-white/25 text-left', fiHeaderCell(), fiMatrixSchemeCell())}>
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
                    <td className={cn(fiMatrixYearCell(), stripe, 'text-foreground')}>{periodLabel}</td>
                    <td colSpan={7} className={cn(fiMatrixDataCell(), 'text-left text-muted-foreground')}>
                      Insufficient NAV history for this window
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={periodLabel} className={cn(stripe, 'border-b-2 border-border')}>
                  <td className={cn(fiMatrixYearCell(), stripe, 'text-foreground')}>{periodLabel}</td>
                  <td className={cn(fiMatrixSchemeCell(), stripe)}>
                    <div className="flex min-w-0 items-start gap-2 sm:gap-2.5">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full ring-2 ring-background sm:mt-1.5 sm:h-2.5 sm:w-2.5"
                        style={{ backgroundColor: FUND_COLOR }}
                        aria-hidden="true"
                      />
                      <p
                        className="break-words text-xs font-medium leading-snug text-emerald-800 dark:text-emerald-300 sm:text-sm"
                        title={fundName}
                      >
                        {fundName}
                      </p>
                    </div>
                  </td>
                  <td className={cn(fiMatrixDataCell(), 'font-semibold')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.average)}
                  </td>
                  <td className={cn(fiMatrixDataCell(), 'font-medium')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.maximum)}
                  </td>
                  <td className={cn(fiMatrixDataCell(), 'font-medium')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.minimum)}
                  </td>
                  <td className={cn(fiMatrixDataCell(), 'font-medium')} style={{ color: FUND_COLOR }}>
                    {formatPercent(row.stdDev)}
                  </td>
                  <td className={cn(fiMatrixDataCell(), 'font-bold text-brand')}>
                    {formatPercent(row.percentAbove10)}
                  </td>
                  <td className={cn(fiMatrixDataCell(), 'font-bold')}>{row.count.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollTable>

      <div className={APP_TABLE_SHELL_FOOTER}>
        Consistency score:{' '}
        <strong className="font-semibold text-brand">
          {rollingReturns.consistencyScore.toFixed(0)}/100
        </strong>
      </div>
    </div>
  )
}
