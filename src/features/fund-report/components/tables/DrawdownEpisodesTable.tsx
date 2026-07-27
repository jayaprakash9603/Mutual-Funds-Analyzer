import { ScrollTable } from '@/components/ui/scroll-table'
import { formatPercent } from '@/lib/utils'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { fiBodyCell, fiHeaderCell, fiStickyLabelCell, FI_GRID, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { cn } from '@/lib/utils'
import type { FundReport } from '../../schemas'

type Drawdown = FundReport['drawdown']

export function DrawdownEpisodesTable({ drawdown }: { drawdown: Drawdown }) {
  const episodes = drawdown.episodes
  const severeCount = episodes.filter((e) => Math.abs(e.fallPercent) >= 20).length
  const criticalCount = episodes.filter((e) => Math.abs(e.fallPercent) >= 30).length
  const ongoingCount = episodes.filter((e) => e.recovered === false).length

  if (episodes.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No major drawdown episodes (≥10% peak-to-trough) detected in the available history.
      </p>
    )
  }

  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">
          All drawdown episodes
          <span className="ml-2 font-normal text-muted-foreground">
            ({episodes.length} total
            {severeCount > 0 ? ` · ${severeCount} ≥20%` : ''}
            {criticalCount > 0 ? ` · ${criticalCount} ≥30%` : ''}
            {ongoingCount > 0 ? ` · ${ongoingCount} ongoing` : ''})
          </span>
        </h4>
      </div>

      <ScrollTable minWidth={720} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th className={fiHeaderCell(fiStickyLabelCell('normal-case z-20'))}>#</th>
              <th className={fiHeaderCell()}>Peak</th>
              <th className={fiHeaderCell()}>Trough</th>
              <th className={fiHeaderCell()}>Recovery</th>
              <th className={fiHeaderCell()}>Status</th>
              <th className={fiHeaderCell()}>Fall</th>
              <th className={fiHeaderCell()}>Duration (yrs)</th>
            </tr>
          </thead>
          <tbody>
            {episodes.map((episode, index) => {
              const severe = Math.abs(episode.fallPercent) >= 20
              const critical = Math.abs(episode.fallPercent) >= 30
              const ongoing = episode.recovered === false
              return (
                <tr
                  key={`${episode.peakDate}-${episode.troughDate}-${index}`}
                  className={cn(
                    index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50/80 dark:bg-muted/20',
                    critical && 'ring-1 ring-inset ring-red-200/80 dark:ring-red-900/50',
                  )}
                >
                  <td className={fiBodyCell(fiStickyLabelCell('font-medium text-muted-foreground'))}>{index + 1}</td>
                  <td className={fiBodyCell()}>{episode.peakDate}</td>
                  <td className={fiBodyCell()}>{episode.troughDate}</td>
                  <td className={fiBodyCell()}>{episode.recoveryDate || '—'}</td>
                  <td className={fiBodyCell()}>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        ongoing
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
                      )}
                    >
                      {ongoing ? 'Ongoing' : 'Recovered'}
                    </span>
                  </td>
                  <td
                    className={fiBodyCell('font-semibold')}
                    style={{ color: severe ? CHART_COLORS.red : undefined }}
                  >
                    {formatPercent(episode.fallPercent)}
                  </td>
                  <td className={fiBodyCell()}>{episode.recoveryYears.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollTable>

      <p className={cn('text-xs text-muted-foreground', FI_GRID)}>
        Episodes are measured from peak to trough when fall reached at least 10%. Duration is recovery time for
        closed episodes, or time underwater since the trough for ongoing drawdowns.
      </p>
    </div>
  )
}
