import { useEffect, useMemo, useState } from 'react'
import { fetchDrawdownPeers, type DrawdownPeers } from '../../api'
import type { FundReport } from '../../schemas'
import { ScrollTable } from '@/components/ui/scroll-table'
import {
  FI_TABLE,
  fiBodyCell,
  fiHeaderCell,
  fiMultiplyHeaderCell,
  fiStickyLabelCell,
} from '@/components/fundsindia/tableStyles'
import { cn, formatPercent } from '@/lib/utils'

type ThresholdRows = FundReport['drawdown']['thresholdRows']

type DrawdownThresholdTableProps = {
  rows: ThresholdRows
  scheme: string
  category: string
  benchmarkName?: string
}

function formatThresholdLabel(threshold: number) {
  if (threshold === 0) return '< 0%'
  return `< ${threshold}%`
}

function rowHasData(
  row: ThresholdRows[number],
  peerValue: number | null | undefined,
): boolean {
  if (row.thresholdPercent === 0) {
    return true
  }
  return (
    row.fundPercentOfDays > 0 ||
    row.benchmarkPercentOfDays > 0 ||
    (peerValue != null && peerValue > 0)
  )
}

export function DrawdownThresholdTable({
  rows,
  scheme,
  category,
  benchmarkName = 'Benchmark',
}: DrawdownThresholdTableProps) {
  const [peers, setPeers] = useState<DrawdownPeers | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPeers(null)
    setLoading(false)
    setError(null)
  }, [scheme, category])

  const loadPeers = () => {
    if (!scheme) return
    setPeers(null)
    setError(null)
    setLoading(true)
    fetchDrawdownPeers(scheme, category || 'All')
      .then(setPeers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load peer drawdown data'))
      .finally(() => setLoading(false))
  }

  const visibleRows = useMemo(() => {
    const peerMap = new Map(
      peers?.thresholdRows.map((r) => [r.thresholdPercent, r.peerMedianPercentOfDays]) ?? [],
    )
    return rows.filter((row) => rowHasData(row, peerMap.get(row.thresholdPercent)))
  }, [rows, peers])

  const peerByThreshold = new Map(
    peers?.thresholdRows.map((r) => [r.thresholdPercent, r.peerMedianPercentOfDays]) ?? [],
  )

  if (rows.length === 0 || visibleRows.length === 0) {
    return <p className="text-sm text-muted-foreground">No drawdown threshold data available.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Share of trading days the fund traded below each drawdown threshold from its running peak.
        Category peers show the median across funds in the same category (loaded on demand).
      </p>

      <ScrollTable minWidth={480} className="rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th className={fiMultiplyHeaderCell(fiStickyLabelCell('normal-case z-20'))}>Drawdown from peak</th>
              <th className={fiHeaderCell()}>Fund</th>
              <th className={fiHeaderCell()}>{benchmarkName}</th>
              <th className={fiHeaderCell()}>Category peers (median)</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => {
              const emphasize = row.thresholdPercent === -10 || row.thresholdPercent === -30
              const peerValue = peerByThreshold.get(row.thresholdPercent)
              return (
                <tr
                  key={row.thresholdPercent}
                  className={cn(
                    index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50/80 dark:bg-muted/20',
                    emphasize && 'ring-1 ring-inset ring-primary/20',
                  )}
                >
                  <td className={fiBodyCell(fiStickyLabelCell('font-medium'))}>{formatThresholdLabel(row.thresholdPercent)}</td>
                  <td className={cn(fiBodyCell(), emphasize && 'font-semibold text-red-700 dark:text-red-400')}>
                    {formatPercent(row.fundPercentOfDays, 0)}
                  </td>
                  <td className={fiBodyCell()}>{formatPercent(row.benchmarkPercentOfDays, 0)}</td>
                  <td className={fiBodyCell()}>
                    {peerValue != null ? formatPercent(peerValue, 0) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollTable>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loadPeers}
          disabled={loading || !scheme}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Loading peer drawdown…' : peers ? 'Reload peer drawdown' : 'Load category peer drawdown'}
        </button>
        {peers && peers.peerCount > 0 && (
          <span className="text-sm text-muted-foreground">
            Median across {peers.peerCount} peer fund{peers.peerCount === 1 ? '' : 's'}.
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  )
}
