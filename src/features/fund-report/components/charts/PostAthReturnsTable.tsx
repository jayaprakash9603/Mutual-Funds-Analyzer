import { ScrollTable } from '@/components/ui/scroll-table'
import { APP_TABLE_MIN_WIDTH, APP_TABLE_SHELL, appTableBodyCell, appTableHeadCell } from '@/lib/ui/appTableStyles'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'

type AllTimeHighs = FundReportRisk['allTimeHighs']

type PostAthReturnsTableProps = {
  postAthReturns: AllTimeHighs['postAthReturns']
  periodLabel: string
  fundName: string
}

const THRESHOLD_ORDER = [
  '>20% returns',
  '>15% returns',
  '>12% returns',
  '>10% returns',
  '>8% returns',
  '>0% returns',
  '<0% returns',
]

function highlightCell(label: string, horizonYears: number) {
  return horizonYears === 1 && (label === '>15% returns' || label === '>12% returns')
}

export function PostAthReturnsTable({
  postAthReturns,
  periodLabel,
  fundName,
}: PostAthReturnsTableProps) {
  const horizons = postAthReturns.horizons
  if (horizons.length === 0) {
    return null
  }

  const hasSamples = horizons.some((horizon) => horizon.sampleCount > 0)
  if (!hasSamples) {
    return (
      <p className="text-sm text-muted-foreground">
        Need more NAV history to estimate post all-time-high forward returns for {fundName}.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          All-time highs don&apos;t automatically imply a fall
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {fundName} performance after investing on an all-time high day ({periodLabel})
        </p>
      </div>

      {postAthReturns.headline ? (
        <p className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm leading-relaxed text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
          {postAthReturns.headline}
        </p>
      ) : null}

      <ScrollTable minWidth={APP_TABLE_MIN_WIDTH.md} className={APP_TABLE_SHELL}>
        <table className="w-full border-collapse text-[11px] leading-snug sm:text-xs md:text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className={appTableHeadCell()}>
                Performance post all-time highs
              </th>
              {horizons.map((horizon) => (
                <th
                  key={horizon.years}
                  className={appTableHeadCell('text-right')}
                >
                  {horizon.label} returns
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={appTableBodyCell('font-semibold')}>Average returns (CAGR)</td>
              {horizons.map((horizon) => (
                <td
                  key={`avg-${horizon.years}`}
                  className={appTableBodyCell('text-right font-mono font-semibold')}
                >
                  {horizon.sampleCount > 0
                    ? formatPercent(horizon.averageCagrPercent, 0)
                    : '—'}
                </td>
              ))}
            </tr>
            <tr className="bg-muted/30 text-[10px] text-muted-foreground sm:text-xs">
              <td className={appTableBodyCell('font-medium')} colSpan={horizons.length + 1}>
                % of times
              </td>
            </tr>
            {THRESHOLD_ORDER.map((label) => (
              <tr key={label}>
                <td className={appTableBodyCell()}>{label}</td>
                {horizons.map((horizon) => {
                  const threshold = horizon.thresholds.find((row) => row.label === label)
                  const emphasize = threshold ? highlightCell(label, horizon.years) : false
                  return (
                    <td
                      key={`${label}-${horizon.years}`}
                      className={cn(
                        appTableBodyCell('text-right font-mono'),
                        emphasize && 'font-semibold text-emerald-700 dark:text-emerald-400',
                      )}
                    >
                      {horizon.sampleCount > 0 && threshold
                        ? formatPercent(threshold.shareOfTimesPercent, 0)
                        : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>

      <p className="text-xs text-muted-foreground">
        Horizons with insufficient history show —. Requires at least 1, 3, or 5 years of subsequent NAV
        data after each all-time high day.
      </p>
    </div>
  )
}
