import { ScrollTable } from '@/components/ui/scroll-table'
import { cn, formatPercent } from '@/lib/utils'
import { fiStickyLabelCell } from '@/components/fundsindia/tableStyles'
import type { FundReportPerformance } from '../../schemas'
import { ReportInsightCard } from '../layout/ReportInsightCard'

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
      <ReportInsightCard
        title="Never interrupt compounding — profit booking underperforms over long periods"
        subtitle={`Rolling ${profitBooking.rollingWindowYears}-year windows vs a ${profitBooking.debtAnnualReturnPercent.toFixed(0)}% debt proxy`}
      >
        <p className="text-sm text-muted-foreground">
          {profitBooking.headline || 'Need at least ten calendar years for profit-booking comparisons.'}
        </p>
      </ReportInsightCard>
    )
  }

  const columns = [
    { key: 'outperformanceAt20Percent' as const, label: 'Profit booking @ 20% gains' },
    { key: 'outperformanceAt30Percent' as const, label: 'Profit booking @ 30% gains' },
    { key: 'outperformanceAt50Percent' as const, label: 'Profit booking @ 50% gains' },
    {
      key: 'outperformanceAtAllTimeHighPercent' as const,
      label: 'Profit booking @ all-time highs',
      highlight: true,
    },
  ]

  const callout = profitBooking.headline ? (
    <p className="rounded-xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-100">
      {profitBooking.headline}
    </p>
  ) : null

  return (
    <ReportInsightCard
      title={
        <span className="text-emerald-700 dark:text-emerald-400">
          Never interrupt compounding — profit booking underperforms over long periods
        </span>
      }
      subtitle={
        <>
          Rolling {profitBooking.rollingWindowYears}-year windows: buy &amp; hold vs moving to a{' '}
          {profitBooking.debtAnnualReturnPercent.toFixed(0)}% debt proxy after each trigger
        </>
      }
      callout={callout}
      footer={profitBooking.methodologyNote ?? undefined}
    >
      <ScrollTable minWidth={920} className="rounded-xl border border-border/70 bg-background">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className={cn('border border-border px-3 py-2 text-left font-semibold', fiStickyLabelCell())}>
                {profitBooking.rollingWindowYears}Y period
              </th>
              <th className="border border-border px-3 py-2 text-right font-semibold">
                Buy &amp; hold CAGR
              </th>
              <th
                className="border border-border px-3 py-2 text-center font-semibold"
                colSpan={columns.length}
              >
                Annualized outperformance of buy &amp; hold vs profit booking
              </th>
            </tr>
            <tr className="bg-muted/30">
              <th className="border border-border px-3 py-2" colSpan={2} />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'border border-border px-3 py-2 text-right font-semibold',
                    col.highlight && 'border-dashed ring-1 ring-inset ring-primary/50',
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profitBooking.rows.map((row) => (
              <tr key={row.periodLabel}>
                <td className={cn('border border-border px-3 py-2 font-medium', fiStickyLabelCell())}>{row.periodLabel}</td>
                <td className="border border-border px-3 py-2 text-right font-mono tabular-nums">
                  {formatPercent(row.buyHoldCagrPercent, 1)}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'border border-border px-3 py-2 text-right font-mono tabular-nums',
                      cellTone(row[col.key]),
                      col.highlight && 'border-dashed ring-1 ring-inset ring-primary/40',
                    )}
                  >
                    {formatPercent(row[col.key], 1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    </ReportInsightCard>
  )
}
