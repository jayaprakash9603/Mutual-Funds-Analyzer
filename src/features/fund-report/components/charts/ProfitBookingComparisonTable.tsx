import { cn, formatPercent } from '@/lib/utils'
import type { FundReportPerformance } from '../../schemas'

type Insights = FundReportPerformance['calendarYearInsights']

type ProfitBookingComparisonTableProps = {
  profitBooking: Insights['profitBooking']
}

function cellTone(value: number) {
  if (value > 0.05) {
    return 'bg-emerald-100/90 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100'
  }
  if (value < -0.05) {
    return 'bg-orange-100/90 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100'
  }
  return ''
}

export function ProfitBookingComparisonTable({ profitBooking }: ProfitBookingComparisonTableProps) {
  if (profitBooking.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {profitBooking.headline || 'Need at least ten calendar years for profit-booking comparisons.'}
      </p>
    )
  }

  const columns = [
    { key: 'outperformanceAt20Percent' as const, label: 'Profit booking @ 20% gains' },
    { key: 'outperformanceAt30Percent' as const, label: 'Profit booking @ 30% gains' },
    { key: 'outperformanceAt50Percent' as const, label: 'Profit booking @ 50% gains' },
    { key: 'outperformanceAtAllTimeHighPercent' as const, label: 'Profit booking @ all-time highs', highlight: true },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          Never interrupt compounding — profit booking underperforms over long periods
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Rolling {profitBooking.rollingWindowYears}-year windows: buy &amp; hold vs moving to a{' '}
          {profitBooking.debtAnnualReturnPercent.toFixed(0)}% debt proxy after each trigger
        </p>
      </div>

      {profitBooking.headline ? (
        <p className="rounded-xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-100">
          {profitBooking.headline}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-[920px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="border border-border px-3 py-2 text-left font-semibold">
                {profitBooking.rollingWindowYears}Y period
              </th>
              <th className="border border-border px-3 py-2 text-right font-semibold">
                Buy &amp; hold CAGR
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'border border-border px-3 py-2 text-right font-semibold',
                    col.highlight && 'ring-1 ring-inset ring-primary/40',
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
            <tr className="bg-muted/30 text-xs text-muted-foreground">
              <th className="border border-border px-3 py-2 text-left font-medium" colSpan={2}>
                Annualized outperformance of buy &amp; hold vs profit booking
              </th>
              {columns.map((col) => (
                <th key={col.key} className="border border-border px-3 py-2 text-right font-medium">
                  Δ CAGR (pp)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profitBooking.rows.map((row) => (
              <tr key={row.periodLabel}>
                <td className="border border-border px-3 py-2 font-medium">{row.periodLabel}</td>
                <td className="border border-border px-3 py-2 text-right font-mono tabular-nums">
                  {formatPercent(row.buyHoldCagrPercent, 1)}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'border border-border px-3 py-2 text-right font-mono tabular-nums',
                      cellTone(row[col.key]),
                      col.highlight && 'ring-1 ring-inset ring-primary/30',
                    )}
                  >
                    {formatPercent(row[col.key], 1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profitBooking.methodologyNote ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{profitBooking.methodologyNote}</p>
      ) : null}
    </div>
  )
}
