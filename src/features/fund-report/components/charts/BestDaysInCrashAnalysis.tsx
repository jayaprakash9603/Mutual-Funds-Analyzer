import type { FundReportRisk } from '../../schemas'
import { formatPercent } from '@/lib/utils'

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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          Many of the best days occur in the middle of a market crash
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Top {bestDays.topBestDays.length || 30} single-day gains for {fundName}, grouped by known stress
          windows ({bestDays.periodLabel})
        </p>
      </div>

      <div
        className={
          bestDays.topDaysCumulative.length > 0
            ? 'grid gap-4 lg:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,280px)]'
            : 'grid gap-4 xl:grid-cols-4'
        }
      >
        {bestDays.crashPeriods.map((period) => (
          <div key={period.periodLabel} className="rounded-xl border border-border bg-card p-3">
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

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[220px] border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-700 text-white">
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">Best day</th>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">Date</th>
                    <th className="border border-border/40 px-2 py-1.5 text-right font-medium">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {period.bestDays.map((day) => (
                    <tr key={`${period.periodLabel}-${day.rank}`}>
                      <td className="border border-border px-2 py-1.5 tabular-nums">{day.rank}</td>
                      <td className="border border-border px-2 py-1.5">{day.date}</td>
                      <td className="border border-border px-2 py-1.5 text-right font-mono tabular-nums">
                        {formatPercent(day.returnPercent, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {bestDays.topDaysCumulative.length > 0 ? (
          <div className="self-start rounded-xl border border-border bg-card p-3 lg:col-span-2 xl:col-span-1">
            <h4 className="mb-2 text-sm font-semibold">Cumulative impact of best days</h4>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="border border-border/40 px-3 py-2 text-left font-medium">Best days</th>
                  <th className="border border-border/40 px-3 py-2 text-right font-medium">Returns</th>
                </tr>
              </thead>
              <tbody>
                {bestDays.topDaysCumulative.map((row) => (
                  <tr key={row.topCount}>
                    <td className="border border-border px-3 py-2">Top {row.topCount} best days</td>
                    <td className="border border-border px-3 py-2 text-right font-mono tabular-nums">
                      {formatPercent(row.cumulativeReturnPercent, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
