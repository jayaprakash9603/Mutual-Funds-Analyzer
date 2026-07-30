import type { FundReportRisk } from '../../schemas'
import { ScrollTable } from '@/components/ui/scroll-table'
import { appTableBodyCell, appTableHeadCell } from '@/lib/ui/appTableStyles'
import { formatPercent } from '@/lib/utils'
import { ReportInsightCard } from '../layout/ReportInsightCard'

type BestDays = FundReportRisk['bestDays']

type BestDaysInCrashAnalysisProps = {
  bestDays: BestDays
  fundName: string
}

export function BestDaysInCrashAnalysis({ bestDays, fundName }: BestDaysInCrashAnalysisProps) {
  if (bestDays.crashPeriods.length === 0) {
    return null
  }

  return (
    <ReportInsightCard
      title="Many of the best days occur in the middle of a market crash"
      subtitle={`Top ${bestDays.topBestDays.length || 30} single-day gains for ${fundName}, grouped by known stress windows (${bestDays.periodLabel})`}
    >
      <div
        className={
          bestDays.topDaysCumulative.length > 0
            ? 'grid gap-3 lg:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,280px)]'
            : 'grid gap-3 xl:grid-cols-4'
        }
      >
        {bestDays.crashPeriods.map((period) => (
          <div key={period.periodLabel} className="rounded-lg border border-border/60 bg-muted/20 p-2.5 sm:p-3">
            <div className="space-y-1 border-b border-border pb-3">
              <h4 className="text-sm font-semibold">{period.periodLabel}</h4>
              {period.marketFallLabel ? (
                <p className="text-xs font-medium text-destructive">
                  Market fall: {period.marketFallLabel}
                </p>
              ) : null}
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {period.topDaysInPeriod} of top {period.topRankLimit} best days
              </p>
            </div>

            <ScrollTable minWidth={220} className="mt-3">
              <table className="w-full border-collapse text-[10px] leading-snug sm:text-[11px] md:text-xs">
                <thead>
                  <tr className="bg-emerald-700 text-white">
                    <th className={appTableHeadCell('border-border/40 bg-emerald-700 text-white')}>Best day</th>
                    <th className={appTableHeadCell('border-border/40 bg-emerald-700 text-white')}>Date</th>
                    <th className={appTableHeadCell('border-border/40 bg-emerald-700 text-right text-white')}>Return</th>
                  </tr>
                </thead>
                <tbody>
                  {period.bestDays.map((day) => (
                    <tr key={`${period.periodLabel}-${day.rank}`}>
                      <td className={appTableBodyCell('tabular-nums')}>{day.rank}</td>
                      <td className={appTableBodyCell()}>{day.date}</td>
                      <td className={appTableBodyCell('text-right font-mono')}>
                        {formatPercent(day.returnPercent, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          </div>
        ))}

        {bestDays.topDaysCumulative.length > 0 ? (
          <div className="self-start rounded-lg border border-border/60 bg-muted/20 p-2.5 sm:p-3 lg:col-span-2 xl:col-span-1">
            <h4 className="mb-2 text-sm font-semibold">Cumulative impact of best days</h4>
            <ScrollTable minWidth={220}>
              <table className="w-full border-collapse text-[11px] leading-snug sm:text-xs">
                <thead>
                  <tr className="bg-emerald-700 text-white">
                    <th className={appTableHeadCell('border-border/40 bg-emerald-700 text-white')}>Best days</th>
                    <th className={appTableHeadCell('border-border/40 bg-emerald-700 text-right text-white')}>Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {bestDays.topDaysCumulative.map((row) => (
                    <tr key={row.topCount}>
                      <td className={appTableBodyCell()}>Top {row.topCount} best days</td>
                      <td className={appTableBodyCell('text-right font-mono')}>
                        {formatPercent(row.cumulativeReturnPercent, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          </div>
        ) : null}
      </div>
    </ReportInsightCard>
  )
}
